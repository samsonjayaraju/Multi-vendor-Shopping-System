package com.multivendor.userservice.controller;

import com.multivendor.userservice.dto.UserResponse;
import com.multivendor.userservice.security.CurrentUser;
import com.multivendor.userservice.service.UserService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
public class UserController {
  private final UserService userService;

  public UserController(UserService userService) {
    this.userService = userService;
  }

  @GetMapping("/api/users/me")
  public UserResponse me() {
    return userService.getById(CurrentUser.id());
  }

  @GetMapping("/api/users/{id}")
  public UserResponse getById(@PathVariable("id") Long id) {
    return userService.getById(id);
  }

  @GetMapping("/api/users")
  public List<UserResponse> getAll() {
    return userService.getAll();
  }

  @GetMapping("/internal/users/{id}")
  public UserResponse getInternalById(@PathVariable("id") Long id) {
    return userService.getById(id);
  }
}
