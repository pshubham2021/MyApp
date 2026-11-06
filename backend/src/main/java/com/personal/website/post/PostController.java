package com.personal.website.post;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@RestController
@RequestMapping("/api/posts")
public class PostController {
    private final PostRepository posts;

    public PostController(PostRepository posts) {
        this.posts = posts;
    }

    @GetMapping
    public List<Post> listPosts(@RequestParam(defaultValue = "") String search,
                                @RequestParam(defaultValue = "newest") String sort) {
        var term = search.trim().toLowerCase(Locale.ROOT);
        var results = posts.findAll().stream()
                .filter(post -> term.isEmpty() || containsSearchTerm(post, term))
                .toList();

        return switch (sort) {
            case "newest" -> results.stream()
                    .sorted((a, b) -> b.getPublishedAt().compareTo(a.getPublishedAt())).toList();
            case "oldest" -> results.stream()
                    .sorted((a, b) -> a.getPublishedAt().compareTo(b.getPublishedAt())).toList();
            case "title" -> results.stream()
                    .sorted((a, b) -> String.CASE_INSENSITIVE_ORDER.compare(a.getTitle(), b.getTitle())).toList();
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported sort order.");
        };
    }

    @PostMapping
    public Post createPost(@Valid @RequestBody CreatePostRequest request) {
        return posts.save(new Post(request.title().trim(), request.excerpt().trim(), request.content().trim(),
                request.category().trim(), Instant.now(), mapAttachments(request.attachments())));
    }

    @PutMapping("/{id}")
    public Post updatePost(@PathVariable Long id, @Valid @RequestBody CreatePostRequest request) {
        var post = posts.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found."));
        post.update(request.title().trim(), request.excerpt().trim(), request.content().trim(),
                request.category().trim(), mapAttachments(request.attachments()));
        return posts.save(post);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        if (!posts.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found.");
        }
        posts.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private List<Attachment> mapAttachments(List<AttachmentRequest> requestedAttachments) {
        return requestedAttachments.stream()
                .map(file -> new Attachment(file.filename(), file.url(), file.contentType(), file.size()))
                .toList();
    }

    private boolean containsSearchTerm(Post post, String term) {
        return contains(post.getTitle(), term) || contains(post.getExcerpt(), term)
                || contains(post.getContent(), term) || contains(post.getCategory(), term);
    }

    private boolean contains(String value, String term) {
        return Objects.requireNonNullElse(value, "").toLowerCase(Locale.ROOT).contains(term);
    }

    public record CreatePostRequest(
            @NotBlank @Size(max = 140) String title,
            @NotBlank @Size(max = 320) String excerpt,
            @NotBlank @Size(max = 10000) String content,
            @NotBlank @Size(max = 40) String category,
            @NotNull List<@Valid AttachmentRequest> attachments) {
    }

    public record AttachmentRequest(
            @NotBlank @Size(max = 255) String filename,
            @NotBlank @Pattern(regexp = "^/uploads/[a-fA-F0-9-]+\\.[a-zA-Z0-9]{1,10}$") String url,
            @NotBlank @Size(max = 100) String contentType,
            @NotNull @jakarta.validation.constraints.PositiveOrZero Long size) {
    }
}
