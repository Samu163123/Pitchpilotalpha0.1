"use client"

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EvaluationData {
  sessionId: string;
  outcome: 'win' | 'loss';
  decision_source: 'input' | 'inferred';
  score: number;
  categories: {
    objection: number;
    rapport: number;
    closing: number;
    clarity: number;
  };
  summary: string;
  strengths: string[];
  improvements: string[];
  moments: Array<{
    timestamp: number;
    title: string;
    whatWorked: string;
    tryInstead: string;
  }>;
  next_skill: string;
  suggested_next_actions: string[];
  notes: {
    persona: string;
    difficulty_adjustment: string;
  };
}

export default function EvaluationPage() {
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvaluation = async () => {
      try {
        const storedData = localStorage.getItem('evaluationData');
        if (!storedData) {
          setError('No evaluation data found');
          return;
        }

        const evaluationData = JSON.parse(storedData);
        
        const response = await fetch('/api/evaluation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evaluationData),
        });

        if (!response.ok) {
          throw new Error('Failed to get evaluation');
        }

        const result = await response.json();
        setEvaluation(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load evaluation');
      } finally {
        setLoading(false);
      }
    };

    loadEvaluation();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 75) return 'bg-blue-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getOutcomeColor = (outcome: string) => {
    return outcome === 'win' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Evaluating Your Call...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        <Card>
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-bold text-red-600 mb-2">Error</h1>
            <p>{error || 'Failed to load evaluation'}</p>
            <Button onClick={() => window.location.href = '/train'} className="mt-4">
              Back to Training
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Call Evaluation</h1>
        <Badge className={getOutcomeColor(evaluation.outcome)}>
          {evaluation.outcome.toUpperCase()}
        </Badge>
      </div>

      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 rounded-full ${getScoreColor(evaluation.score)} flex items-center justify-center text-white font-bold text-xl`}>
              {evaluation.score}
            </div>
            <div>
              <p className="text-lg font-semibold">Score: {evaluation.score}/100</p>
              <p className="text-sm text-muted-foreground">Session: {evaluation.sessionId}</p>
            </div>
          </div>
          <p className="text-sm">{evaluation.summary}</p>
        </CardContent>
      </Card>

      {/* Category Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(evaluation.categories).map(([category, score]) => (
              <div key={category} className="text-center">
                <div className={`w-12 h-12 rounded-full ${getScoreColor(score)} flex items-center justify-center text-white font-bold mx-auto mb-2`}>
                  {score}
                </div>
                <p className="text-sm font-medium capitalize">{category}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strengths and Improvements */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {evaluation.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span className="text-sm">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">Areas for Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {evaluation.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">→</span>
                  <span className="text-sm">{improvement}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Key Moments */}
      <Card>
        <CardHeader>
          <CardTitle>Key Moments Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {evaluation.moments.map((moment, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">{moment.title}</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-green-600 mb-1">What Worked:</p>
                    <p>{moment.whatWorked}</p>
                  </div>
                  <div>
                    <p className="font-medium text-orange-600 mb-1">Try Instead:</p>
                    <p>{moment.tryInstead}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium mb-2">Focus on: {evaluation.next_skill}</p>
            </div>
            <div>
              <p className="font-medium mb-2">Suggested Actions:</p>
              <ul className="space-y-1">
                {evaluation.suggested_next_actions.map((action, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        <Button onClick={() => window.location.href = '/train'}>
          Practice Again
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/challenges'}>
          Try Challenges
        </Button>
      </div>
    </div>
  );
}
