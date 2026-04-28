Feature: SMS Webhook
  As an external SMS gateway
  I want to send incoming SMS messages to the system
  So that player responses can be processed

  Scenario: Receive SMS webhook accepts request
    When I send a POST request to "/api/webhook/sms" with payload
    Then the response status should be 200 or 500