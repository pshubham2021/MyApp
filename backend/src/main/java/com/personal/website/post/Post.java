package com.personal.website.post;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 140)
    private String title;

    @Column(nullable = false, length = 320)
    private String excerpt;

    @Column(nullable = false, length = 10000)
    private String content;

    @Column(nullable = false, length = 40)
    private String category;

    @Column(nullable = false)
    private Instant publishedAt;

    @ElementCollection
    @CollectionTable(name = "post_attachments", joinColumns = @JoinColumn(name = "post_id"))
    @OrderColumn(name = "attachment_order")
    private List<Attachment> attachments = new ArrayList<>();

    protected Post() {
    }

    public Post(String title, String excerpt, String content, String category, Instant publishedAt,
                List<Attachment> attachments) {
        this.title = title;
        this.excerpt = excerpt;
        this.content = content;
        this.category = category;
        this.publishedAt = publishedAt;
        this.attachments = new ArrayList<>(attachments);
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getExcerpt() {
        return excerpt;
    }

    public String getContent() {
        return content;
    }

    public String getCategory() {
        return category;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public List<Attachment> getAttachments() {
        return attachments;
    }

    public void update(String title, String excerpt, String content, String category,
                       List<Attachment> attachments) {
        this.title = title;
        this.excerpt = excerpt;
        this.content = content;
        this.category = category;
        this.attachments = new ArrayList<>(attachments);
    }
}
