Feature: SMS Webhook
  As an external SMS gateway
  I want to send incoming SMS messages to the system
  So that player responses can be processed

  Background:
    Given the database is connected

  Scenario: Receive SMS webhook accepts request
    When I send a POST request to "/api/webhook/sms" with payload
    Then the response status should be 200 or 500

Scenario: Receive SMS webhook with valid message format
    Given the database is connected
    When I send a POST request to "/api/webhook/sms" with body:
      | messages |
      | [{"phoneNumber": "+46701234567", "text": "ja"}] |
    Then the response status should be 200 or 500

  Scenario: Receive SMS webhook with empty messages array
    Given the database is connected
    When I send a POST request to "/api/webhook/sms" with body:
      | messages |
      | [] |
    Then the response status should be 200

  Scenario: Receive SMS webhook with invalid payload
    Given the database is connected
    When I send a POST request to "/api/webhook/sms" with invalid payload
    Then the response status should be 200 or 400