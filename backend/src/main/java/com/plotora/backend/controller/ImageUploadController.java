package com.plotora.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/uploads")
public class ImageUploadController {
    private final Path uploadDirectory;

    public ImageUploadController(@Value("${app.upload-dir:uploads}") String uploadDirectory) throws IOException {
        this.uploadDirectory = Paths.get(uploadDirectory).toAbsolutePath().normalize();
        Files.createDirectories(this.uploadDirectory);
    }

    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UploadResponse uploadImages(@RequestParam("files") List<MultipartFile> files) throws IOException {
        if (files.isEmpty() || files.size() > 10) {
            throw new UploadException("Choose between 1 and 10 images.");
        }
        List<String> urls = files.stream().map(this::store).toList();
        return new UploadResponse(urls);
    }

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> serveImage(@PathVariable String filename) throws IOException {
        Path file = uploadDirectory.resolve(filename).normalize();
        if (!file.getParent().equals(uploadDirectory) || !Files.exists(file)) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new UrlResource(file.toUri());
        String contentType = Files.probeContentType(file);
        MediaType mediaType = contentType == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(contentType);
        return ResponseEntity.ok().contentType(mediaType).body(resource);
    }

    private String store(MultipartFile file) {
        String type = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!type.equals("image/jpeg") && !type.equals("image/png") && !type.equals("image/webp")) {
            throw new UploadException("Only JPEG, PNG, and WebP images are supported.");
        }
        if (file.isEmpty() || file.getSize() > 10_000_000) {
            throw new UploadException("Each image must be between 1 byte and 10 MB.");
        }
        String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + "." + (extension == null ? "bin" : extension.toLowerCase());
        try {
            file.transferTo(uploadDirectory.resolve(filename));
        } catch (IOException e) {
            throw new UploadException("Could not save the image.", e);
        }
        return ServletUriComponentsBuilder.fromCurrentContextPath().path("/api/v1/uploads/").path(filename).toUriString();
    }

    public record UploadResponse(List<String> urls) {}

    @ExceptionHandler(UploadException.class)
    public ResponseEntity<ProblemDetail> handleUploadFailure(UploadException exception) {
        HttpStatus status = exception.getCause() == null ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR;
        return ResponseEntity.status(status).body(ProblemDetail.forStatusAndDetail(status, exception.getMessage()));
    }

    private static class UploadException extends RuntimeException {
        UploadException(String message) { super(message); }
        UploadException(String message, Throwable cause) { super(message, cause); }
    }
}
