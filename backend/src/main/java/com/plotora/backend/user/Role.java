package com.plotora.backend.user;

import jakarta.persistence.*;

@Entity
@Table(name = "roles")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Short id;

    @Column(nullable = false, unique = true, length = 30)
    private String name;

    protected Role() {}

    public Role(String name) {
        this.name = name;
    }

    public Short getId() { return id; }
    public String getName() { return name; }
}