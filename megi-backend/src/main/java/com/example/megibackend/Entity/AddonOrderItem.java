package com.example.megibackend.Entity;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@DiscriminatorValue("ADDON")
@Getter
@Setter
@NoArgsConstructor
public class AddonOrderItem extends OrderItem {
    @ManyToOne
    @JoinColumn(name = "addon_id")
    private Addon addon;
}