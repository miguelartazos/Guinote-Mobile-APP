import { describe, test, expect, beforeEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { sanitizeInput, sanitizers } from './sanitizer.js';

describe('Input Sanitization', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(sanitizeInput());

    app.post('/test', (req, res) => {
      res.json({
        body: req.body,
        query: req.query,
        params: req.params,
      });
    });
  });

  describe('sanitizeInput middleware', () => {
    test('removes HTML tags from request body', async () => {
      const maliciousData = {
        message: '<script>alert("xss")</script>Hello World',
        username: '<img src="x" onerror="alert(1)">TestUser',
      };

      const response = await request(app).post('/test').send(maliciousData);

      expect(response.status).toBe(200);
      expect(response.body.body.message).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;Hello World',
      );
      expect(response.body.body.username).toBe('&lt;img src=&quot;x&'); // Truncated at 20 chars
    });

    test('limits string length', async () => {
      const longString = 'a'.repeat(2000);
      const data = { message: longString };

      const response = await request(app).post('/test').send(data);

      expect(response.status).toBe(200);
      expect(response.body.body.message.length).toBe(500); // message limit is 500
    });

    test('ignores unknown nested fields', async () => {
      const nestedData = {
        message: '<script>evil</script>Safe content',
        user: {
          profile: {
            bio: '<script>not sanitized</script>',
            preferences: {
              theme: '<b>not sanitized</b>',
            },
          },
        },
      };

      const response = await request(app).post('/test').send(nestedData);

      expect(response.status).toBe(200);
      expect(response.body.body.message).toBe(
        '&lt;script&gt;evil&lt;/script&gt;Safe content',
      );
      // Nested fields are not sanitized in the simplified version
      expect(response.body.body.user.profile.bio).toBe(
        '<script>not sanitized</script>',
      );
    });

    test('does not handle arrays in simplified version', async () => {
      const arrayData = {
        message: '<script>sanitized</script>Test',
        unknownArray: ['<script>not sanitized</script>Message 1', 'Message 2'],
      };

      const response = await request(app).post('/test').send(arrayData);

      expect(response.status).toBe(200);
      expect(response.body.body.message).toBe(
        '&lt;script&gt;sanitized&lt;/script&gt;Test',
      );
      // Arrays are not handled in simplified version
      expect(response.body.body.unknownArray).toEqual([
        '<script>not sanitized</script>Message 1',
        'Message 2',
      ]);
    });

    test('preserves non-string values', async () => {
      const mixedData = {
        count: 42,
        active: true,
        timestamp: null,
        score: 98.5,
        message: '<b>Bold text</b>',
      };

      const response = await request(app).post('/test').send(mixedData);

      expect(response.status).toBe(200);
      expect(response.body.body.count).toBe(42);
      expect(response.body.body.active).toBe(true);
      expect(response.body.body.timestamp).toBe(null);
      expect(response.body.body.score).toBe(98.5);
      expect(response.body.body.message).toBe('&lt;b&gt;Bold text&lt;/b&gt;');
    });

    test('handles query parameters', async () => {
      const response = await request(app)
        .post('/test?search=<script>evil</script>query&limit=10')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.query.search).toBe(
        '&lt;script&gt;evil&lt;/script&gt;query',
      );
      expect(response.body.query.limit).toBe('10');
    });
  });

  describe('specific sanitizers', () => {
    test('username sanitizer', () => {
      expect(sanitizers.username('<script>test</script>user')).toBe(
        '&lt;script&gt;test&l',
      ); // Truncated at 20 chars
      expect(sanitizers.username('a'.repeat(25)).length).toBe(20);
      expect(sanitizers.username('  spaced  ')).toBe('spaced');
    });

    test('email sanitizer', () => {
      expect(sanitizers.email('Test@EXAMPLE.COM')).toBe('test@example.com');
      expect(sanitizers.email('<script>hack</script>user@domain.com')).toBe(
        '&lt;script&gt;hack&lt;/script&gt;user@domain.com',
      );
    });

    test('chat message sanitizer', () => {
      const message = '<img src="x" onerror="alert()">Hello <b>world</b>!';
      expect(sanitizers.chatMessage(message)).toBe(
        '&lt;img src=&quot;x&quot; onerror=&quot;alert()&quot;&gt;Hello &lt;b&gt;world&lt;/b&gt;!',
      );

      const longMessage = 'a'.repeat(600);
      expect(sanitizers.chatMessage(longMessage).length).toBe(500);
    });

    test('player name sanitizer', () => {
      expect(sanitizers.playerName('Player <script>evil</script> One')).toBe(
        'Player &lt;script&gt;evil&lt;/script&gt; One',
      );
      expect(sanitizers.playerName('a'.repeat(100)).length).toBe(50);
    });

    test('game action sanitizer', () => {
      expect(sanitizers.gameAction('<b>play_card</b>')).toBe(
        '&lt;b&gt;play_card&lt;/b&gt;',
      );
      expect(sanitizers.gameAction('a'.repeat(200)).length).toBe(100);
    });
  });
});
