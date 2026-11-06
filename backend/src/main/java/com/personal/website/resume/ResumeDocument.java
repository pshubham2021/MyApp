package com.personal.website.resume;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "resume_document")
public class ResumeDocument {
    @Id
    private Long id;

    @Lob
    @Column(nullable = false)
    private String content;

    @Column(nullable = false)
    private Instant updatedAt;

    protected ResumeDocument() {
    }

    public ResumeDocument(Long id, String content, Instant updatedAt) {
        this.id = id;
        this.content = content;
        this.updatedAt = updatedAt;
    }

    public String getContent() {
        return content;
    }
}
