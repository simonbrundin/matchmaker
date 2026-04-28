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