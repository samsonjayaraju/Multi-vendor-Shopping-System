package com.multivendor.userservice.config;

import com.multivendor.userservice.entity.User;
import com.multivendor.userservice.enums.Role;
import com.multivendor.userservice.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@Profile("!test")
public class DataInitializer {
  @Bean
  CommandLineRunner seedUsers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
    return args -> {
      if (userRepository.count() == 0) {
        User vendor1 = new User();
        vendor1.setName("Cupertino Audio Lab");
        vendor1.setEmail("vendor1@atelier.com");
        vendor1.setPassword(passwordEncoder.encode("password123"));
        vendor1.setRole(Role.VENDOR);
        userRepository.save(vendor1);

        User vendor2 = new User();
        vendor2.setName("Studio Minimalist Co.");
        vendor2.setEmail("vendor2@atelier.com");
        vendor2.setPassword(passwordEncoder.encode("password123"));
        vendor2.setRole(Role.VENDOR);
        userRepository.save(vendor2);

        User customer = new User();
        customer.setName("Samson Jayaraju");
        customer.setEmail("customer@atelier.com");
        customer.setPassword(passwordEncoder.encode("password123"));
        customer.setRole(Role.CUSTOMER);
        userRepository.save(customer);
      }
    };
  }
}
