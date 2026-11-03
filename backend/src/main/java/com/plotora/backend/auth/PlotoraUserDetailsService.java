package com.plotora.backend.auth;

import com.plotora.backend.user.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class PlotoraUserDetailsService implements UserDetailsService {
    private final UserRepository users;

    public PlotoraUserDetailsService(UserRepository users) {
        this.users = users;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        var user = users.findByEmailIgnoreCase(email.trim())
            .filter(candidate -> "ACTIVE".equals(candidate.getStatus()) && candidate.getPasswordHash() != null)
            .orElseThrow(() -> new UsernameNotFoundException("Account not found"));
        String[] authorities = user.getRoles().stream().map(role -> "ROLE_" + role.getName()).toArray(String[]::new);
        return org.springframework.security.core.userdetails.User.withUsername(user.getEmail())
            .password(user.getPasswordHash())
            .authorities(authorities)
            .build();
    }
}
