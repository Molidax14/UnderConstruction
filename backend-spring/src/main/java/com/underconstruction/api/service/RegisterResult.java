package com.underconstruction.api.service;

public sealed interface RegisterResult {

    record Ok() implements RegisterResult {}

    record Error(String message) implements RegisterResult {}
}
