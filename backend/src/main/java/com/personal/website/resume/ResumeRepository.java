package com.personal.website.resume;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ResumeRepository extends JpaRepository<ResumeDocument, Long> {
}
