package com.personal.website.post;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
public class SamplePostLoader implements CommandLineRunner {
    private final PostRepository posts;

    public SamplePostLoader(PostRepository posts) {
        this.posts = posts;
    }

    @Override
    public void run(String... args) {
        if (posts.count() > 0) {
            return;
        }

        posts.saveAll(List.of(
                new Post("A small reset for a clearer week",
                        "Lately I have been trying to make room for the work that matters by making my plans a little smaller.",
                        "Lately I have been trying to make room for the work that matters by making my plans a little smaller. One list, three priorities, and a short walk before opening the laptop. It is not a system so much as a gentle reminder that a good week is made of ordinary days.",
                        "Life", Instant.parse("2026-10-28T09:00:00Z"), List.of()),
                new Post("What I learned from building in public",
                        "Sharing work before it feels finished is a surprisingly good way to get unstuck.",
                        "Sharing work before it feels finished is a surprisingly good way to get unstuck. A small update makes the next step easier to see, and other people often notice the useful detail you had stopped looking at. This is my reminder to keep showing up, one imperfect version at a time.",
                        "Builds", Instant.parse("2026-10-19T10:30:00Z"), List.of()),
                new Post("A few things I am reading this month",
                        "A short list of writing on thoughtful software, creative habits, and noticing more.",
                        "A short list of writing on thoughtful software, creative habits, and noticing more. I am keeping this space for the links, photos, and documents I want to find again—rather than letting them disappear into another tab.",
                        "Notes", Instant.parse("2026-10-11T08:15:00Z"), List.of())
        ));
    }
}
