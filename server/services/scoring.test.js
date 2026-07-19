import { calculateScore, evaluateBadges } from './scoring.js';

describe('Scoring Service', () => {
  describe('calculateScore', () => {
    it('should correctly score correct and wrong answers', () => {
      const questions = [
        {
          id: 'q1',
          question_snapshot_json: {
            correct_answer_json: JSON.stringify(['opt_1'])
          }
        },
        {
          id: 'q2',
          question_snapshot_json: {
            correct_answer_json: JSON.stringify(['opt_2'])
          }
        }
      ];

      const answers = [
        {
          attempt_question_id: 'q1',
          selected_option_id: 'opt_1',
          time_taken_seconds: 15,
          hint_used: false,
          fifty_fifty_used: false,
          timed_out: false
        },
        {
          attempt_question_id: 'q2',
          selected_option_id: 'opt_3', // wrong
          time_taken_seconds: 15,
          hint_used: false,
          fifty_fifty_used: false,
          timed_out: false
        }
      ];

      const results = calculateScore(answers, questions);

      expect(results.totalScore).toBe(1.00);
      expect(results.maxScore).toBe(2);
      expect(results.percentage).toBe(50.00);
      expect(results.xpEarned).toBe(15); // 10 (1 correct) + 5 (completion)
      expect(results.gradedAnswers[0].isCorrect).toBe(true);
      expect(results.gradedAnswers[1].isCorrect).toBe(false);
    });

    it('should apply lifeline penalties but floor question score at 0', () => {
      const questions = [
        {
          id: 'q1',
          question_snapshot_json: {
            correct_answer_json: JSON.stringify(['opt_1'])
          }
        },
        {
          id: 'q2',
          question_snapshot_json: {
            correct_answer_json: JSON.stringify(['opt_2'])
          }
        }
      ];

      const answers = [
        {
          attempt_question_id: 'q1',
          selected_option_id: 'opt_1', // correct
          time_taken_seconds: 15,
          hint_used: true, // -0.25
          fifty_fifty_used: true, // -0.25
          timed_out: false
        },
        {
          attempt_question_id: 'q2',
          selected_option_id: 'opt_3', // wrong (0 points)
          time_taken_seconds: 15,
          hint_used: true, // -0.25 (should floor at 0)
          fifty_fifty_used: false,
          timed_out: false
        }
      ];

      const results = calculateScore(answers, questions);

      expect(results.totalScore).toBe(0.50); // 0.5 for Q1, 0 for Q2
      expect(results.gradedAnswers[0].pointsAwarded).toBe(0.50);
      expect(results.gradedAnswers[1].pointsAwarded).toBe(0.00);
    });

    it('should award fast answer and streak bonuses', () => {
      const questions = [
        { id: 'q1', question_snapshot_json: { correct_answer_json: JSON.stringify(['opt_1']) } },
        { id: 'q2', question_snapshot_json: { correct_answer_json: JSON.stringify(['opt_2']) } },
        { id: 'q3', question_snapshot_json: { correct_answer_json: JSON.stringify(['opt_3']) } }
      ];

      const answers = [
        {
          attempt_question_id: 'q1',
          selected_option_id: 'opt_1',
          time_taken_seconds: 5, // fast! (+0.25)
          hint_used: false,
          fifty_fifty_used: false,
          timed_out: false
        },
        {
          attempt_question_id: 'q2',
          selected_option_id: 'opt_2',
          time_taken_seconds: 15, // normal
          hint_used: false,
          fifty_fifty_used: false,
          timed_out: false
        },
        {
          attempt_question_id: 'q3',
          selected_option_id: 'opt_3',
          time_taken_seconds: 15, // normal, but 3rd in streak! (+1.0)
          hint_used: false,
          fifty_fifty_used: false,
          timed_out: false
        }
      ];

      const results = calculateScore(answers, questions);

      // Q1: 1.0 (base) + 0.25 (fast) = 1.25
      // Q2: 1.0 (base) = 1.0
      // Q3: 1.0 (base) + 1.0 (streak) = 2.0
      // Total: 4.25
      expect(results.totalScore).toBe(4.25);
      expect(results.xpEarned).toBe(35); // 3 * 10 + 5
    });
  });

  describe('evaluateBadges', () => {
    it('should award first_quiz badge', () => {
      const history = [];
      const newAttempt = { max_score: 5, percentage: 60.00, topic_id: 1 };
      const currentBadges = [];

      const badges = evaluateBadges(history, newAttempt, currentBadges);
      expect(badges).toContain('first_quiz');
    });

    it('should award perfect_score badge if score is 100% and >= 5 questions', () => {
      const history = [];
      const newAttempt = { max_score: 5, percentage: 100.00, topic_id: 1 };
      const currentBadges = ['first_quiz'];

      const badges = evaluateBadges(history, newAttempt, currentBadges);
      expect(badges).toContain('perfect_score');
    });

    it('should not award perfect_score if questions count < 5', () => {
      const history = [];
      const newAttempt = { max_score: 3, percentage: 100.00, topic_id: 1 };
      const currentBadges = ['first_quiz'];

      const badges = evaluateBadges(history, newAttempt, currentBadges);
      expect(badges).not.toContain('perfect_score');
    });
  });
});
