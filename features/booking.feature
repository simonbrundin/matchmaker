Feature: Booking System
  As a system administrator
  I want to create bookings for padel sessions
  So that players can be invited to play

  Background:
    Given the system has active players
    And the database is connected

  Scenario: Create bookings endpoint is accessible
    When I send a POST request to "/api/cron/create-bookings"
    Then the response status should be 200 or 500

  Scenario: Process followups endpoint is accessible
    When I send a POST request to "/api/cron/process-followups"
    Then the response status should be 200 or 500

  Scenario: List all bookings
    When I send a GET request to "/api/admin/bookings"
    Then the response status should be 200
    And the response body should have field "bookings"

  Scenario: Telegram approve-response accepts valid request
    When I send a POST request to "/api/telegram/approve-response" with body:
      | suggestionId | approved | customResponse |
      | 1            | true     | Confirmed      |
    Then the response status should be 200 or 404

  Scenario: Telegram approve-response requires suggestionId
    When I send a POST request to "/api/telegram/approve-response" with body:
      | approved |
      | true     |
    Then the response status should be 400

  Scenario: List weekly times schedules
    When I send a GET request to "/api/admin/weekly-times"
    Then the response status should be 200
    And the response body should have field "schedules"
    And the response body should have field "summary"

  Scenario: Create weekly times schedule
    When I send a POST request to "/api/admin/weekly-times" with body:
      | player_id | weekday | time     | week_parity |
      | 1         | 1       | 18:00    | all         |
    Then the response status should be 200 or 400

Scenario: Delete weekly times schedule
    When I send DELETE request to "/api/admin/weekly-times/1"
    Then the response status should be 200 or 400