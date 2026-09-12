package com.runway.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Category parent;

    @Column(nullable = false, length = 7)
    private String color;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Category() {}

    public Category(UUID id, User user, String name, Category parent, String color, Instant createdAt) {
        this.id = id;
        this.user = user;
        this.name = name;
        this.parent = parent;
        this.color = color;
        this.createdAt = createdAt;
    }

    public static CategoryBuilder builder() {
        return new CategoryBuilder();
    }

    public static class CategoryBuilder {
        private UUID id;
        private User user;
        private String name;
        private Category parent;
        private String color;
        private Instant createdAt;

        public CategoryBuilder id(UUID id) { this.id = id; return this; }
        public CategoryBuilder user(User user) { this.user = user; return this; }
        public CategoryBuilder name(String name) { this.name = name; return this; }
        public CategoryBuilder parent(Category parent) { this.parent = parent; return this; }
        public CategoryBuilder color(String color) { this.color = color; return this; }
        public CategoryBuilder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }

        public Category build() {
            return new Category(id, user, name, parent, color, createdAt);
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Category getParent() { return parent; }
    public void setParent(Category parent) { this.parent = parent; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
