Feature: Health Check
  As a system monitor
  I want to verify the system is operational
  So that I can ensure all services are running

  Background:
    Given the database is connected

  Scenario: Health endpoint confirms system is operational
    When I send a GET request to "/api/health"
    Then the response status should be 200
    And the response body should have field "status" equal to "ok"
    And the response body should have field "database" equal to "connected"

  Scenario: Health endpoint returns valid timestamp
    When I send a GET request to "/api/health"
    Then the response status should be 200
    And the response body should have field "timestamp"
    And the timestamp should be valid ISO 8601 format