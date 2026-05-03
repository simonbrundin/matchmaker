@test @destructive
Feature: Player Management
  As an admin user
  I want to view, create, update and delete players
  So that I can organize padel sessions with the right participants

  Background:
    Given the database is connected

  @create-player
  Scenario: Create a new player with valid data
    When I send a POST request to "/api/admin/players" with body:
      | phone        | name            | elo |
      | +47999999991 | Test Creator     | 1300 |
    Then the response status should be 200
    And the response body should have field "player"
    And I store the player ID for cleanup

  @create-player
  Scenario: Reject player creation without required fields
    When I send a POST request to "/api/admin/players" with body:
      | phone | name     |
      |       | Test Player |
    Then the response status should be 400

  @create-player
  Scenario: Reject player creation with duplicate phone
    When I send a POST request to "/api/admin/players" with body:
      | phone        | name              |
      | +47999999991 | Duplicate Player  |
    Then the response status should be 409

  Scenario: View all players
    When I send a GET request to "/api/admin/players"
    Then the response status should be 200
    And the response body should have field "players"

  Scenario: Filter players by active status
    When I send a GET request to "/api/admin/players?active=true"
    Then the response status should be 200
    And the response body should have field "players"

  Scenario: Search players by name
    When I send a GET request to "/api/admin/players?search=Emma"
    Then the response status should be 200
    And the response body should have field "players"

  Scenario: Get player by ID returns 404 for non-existent player
    When I send a GET request to "/api/admin/players/non-existent-id"
    Then the response status should be 404

  Scenario: Update player returns 404 when player does not exist
    When I send PUT request to "/api/admin/players/non-existent-id" with body:
      | name | elo   |
      | Test | 1400  |
    Then the response status should be 404

  Scenario: Delete player returns 404 when player does not exist
    When I send DELETE request to "/api/admin/players/non-existent-id"
    Then the response status should be 404

  Scenario: Search player by phone returns 404 when not found
    When I send a GET request to "/api/admin/players-by-phone" with query:
      | phone         |
      | +47999999998  |
    Then the response status should be 404
    And the response body should have field "message"

  Scenario: Search player by phone returns 400 when phone parameter is missing
    When I send a GET request to "/api/admin/players-by-phone"
    Then the response status should be 400

  @create-player
  Scenario: Search player by phone
    When I send a POST request to "/api/admin/players" with body:
      | phone        | name          | elo |
      | +47999999993 | Search Player | 1250 |
    Then the response status should be 200
    And I store the player ID for cleanup
    When I send a GET request to "/api/admin/players-by-phone" with query:
      | phone         |
      | +47999999993  |
    Then the response status should be 200
    And the response body should have field "player"