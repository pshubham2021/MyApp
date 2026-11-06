package com.personal.website.resume;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@RestController
@RequestMapping("/api/resume")
public class ResumeController {
    private static final long DOCUMENT_ID = 1L;
    private final ResumeRepository resumes;
    private final ObjectMapper objectMapper;

    public ResumeController(ResumeRepository resumes, ObjectMapper objectMapper) {
        this.resumes = resumes;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public ResumeData getResume() {
        return resumes.findById(DOCUMENT_ID)
                .map(document -> deserialize(document.getContent()))
                .orElseGet(ResumeData::initial);
    }

    @PutMapping
    public ResumeData saveResume(@Valid @RequestBody ResumeData resume) {
        try {
            var content = objectMapper.writeValueAsString(resume);
            resumes.save(new ResumeDocument(DOCUMENT_ID, content, Instant.now()));
            return resume;
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "The resume could not be saved.", exception);
        }
    }

    private ResumeData deserialize(String content) {
        try {
            return objectMapper.readValue(content, ResumeData.class);
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "The saved resume could not be read.", exception);
        }
    }
}
