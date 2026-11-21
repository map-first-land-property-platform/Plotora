package com.plotora.backend.auth.recovery;

import com.plotora.backend.auth.AuthMailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@Component
@ConditionalOnProperty(name = "app.recovery.worker-enabled", havingValue = "true", matchIfMissing = true)
public class RecoveryMailWorker {
    private static final Logger log = LoggerFactory.getLogger(RecoveryMailWorker.class);
    private final RecoveryMailQueue queue;
    private final PasswordRecoveryService recovery;
    private final AuthMailService mail;
    public RecoveryMailWorker(RecoveryMailQueue queue, PasswordRecoveryService recovery, AuthMailService mail) {
        this.queue = queue; this.recovery = recovery; this.mail = mail;
    }

    @Scheduled(fixedDelayString = "${app.recovery.poll-ms:2000}")
    public void deliver() {
        for (var id : queue.dueIds()) {
            RecoveryMailQueue.Job job = null;
            try {
                job = queue.claim(id);
                if (job == null) continue;
                if (job.kind().equals("RESET_REQUEST")) { recovery.prepareResetMail(job); continue; }
                if (job.kind().equals("RESET_LINK")) {
                    if (recovery.canSendLink(job.tokenHash())) {
                        String[] payload = job.payload().split("\n", 2);
                        mail.sendPasswordReset(payload[0], payload[1]);
                    }
                } else if (job.kind().equals("PASSWORD_CHANGED")) mail.sendPasswordChanged(job.payload());
                queue.remove(id);
            } catch (Exception failure) {
                // Never log recipients, tokens, SMTP exception text or mail payloads.
                boolean retrying = job != null && queue.retry(job);
                log.warn("Recovery mail job {} failed ({}); retry scheduled: {}", id, failure.getClass().getSimpleName(), retrying);
            }
        }
    }

    @Scheduled(fixedDelay = 60000)
    public void cleanup() { queue.cleanup(); recovery.cleanup(); }
}
