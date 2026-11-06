package com.personal.website.post;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {
    @Override
    @EntityGraph(attributePaths = "attachments")
    List<Post> findAll();

    @Override
    @EntityGraph(attributePaths = "attachments")
    Optional<Post> findById(Long id);
}
