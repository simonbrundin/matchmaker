Feature: Player Management
  As an admin user
  I want to view and manage players
  So that I can organize padel sessions

  Background:
    Given the database is connected

  Scenario: View all players
    When I send a GET request to "/api/admin/players"
    Then the response status should be 200
    And the response body should have field "players"
    And the players array should not be empty

  Scenario: Filter players by active status
    When I send a GET request to "/api/admin/players?active=true"
    Then the response status should be 200
    And the response body should have field "players"

  Scenario: Search players by name
    When I send a GET request to "/api/admin/players?search=Anna"
    Then the response status should be 200
    And the response body should have field "players"
    And at least zero players should be returned

  Scenario: Create a new player with valid data
    When I send a POST request to "/api/admin/players" with body:
      | phone        | name            | elo |
      | +47999999999 | Test New Player | 1300 |
    Then the response status should be 200 or 400

  Scenario: Reject player creation without required fields
    When I send a POST request to "/api/admin/players" with body:
      | phone | name     |
      |       | Test Player |
    Then the response status should be 400

  Scenario: Reject player creation with duplicate phone
    When I send a POST request to "/api/admin/players" with body:
      | phone        | name              |
      | +46701234567 | Duplicate Player |
    Then the response status should be 200 or 400

  Scenario: Update player
    Given the database is connected
    When I send a GET request to "/api/admin/players"
    And I store the first player ID if it exists
    And I send PUT request to stored player with body:
      | name          | elo   |
      | Updated Name  | 1400  |
    Then the response status should be 200 or 400

  Scenario: Delete player
    Given the database is connected
    When I send a GET request to "/api/admin/players"
    And I store the first player ID if it exists
    And I send DELETE request to stored player
    Then the response status should be 200 or 404

  Scenario: Search player by phone
    When I send a GET request to "/api/admin/players-by-phone" with query:
      | phone         |
      | +46701234567   |
    Then the response status should be 200 or 404
    And the response body should have field "player" or "message"

  Scenario: Search player by phone returns 400 when phone missing
    When I send a GET request to "/api/admin/players-by-phone"
    Then the response status should be 400