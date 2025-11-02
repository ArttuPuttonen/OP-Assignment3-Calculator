import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

interface CalculationRequest {
  principal: number;
  rate: number;
  years: number;
  frequency: number;
}

interface CalculationResponse {
  result: number;
  principal: number;
  rate: number;
  years: number;
  frequency: number;
}

interface ErrorResponse {
  error: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing request body' } as ErrorResponse),
      };
    }

    const { principal, rate, years, frequency }: CalculationRequest = JSON.parse(event.body);

    // Validate inputs
    if (principal === undefined || rate === undefined || years === undefined || frequency === undefined) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' } as ErrorResponse),
      };
    }

    // Validate positive values
    if (principal <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Principal must be positive' } as ErrorResponse),
      };
    }

    if (rate < 0 || rate > 100) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Interest rate must be between 0 and 100' } as ErrorResponse),
      };
    }

    if (years <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Years must be positive' } as ErrorResponse),
      };
    }

    if (![1, 2, 4, 12, 365].includes(frequency)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Frequency must be 1, 2, 4, 12, or 365' } as ErrorResponse),
      };
    }

    // Calculate compound interest: A = P(1 + r/n)^(nt)
    const rateDecimal = rate / 100;
    const result = principal * Math.pow(1 + rateDecimal / frequency, frequency * years);
    const roundedResult = Math.round(result * 100) / 100;

    const response: CalculationResponse = {
      result: roundedResult,
      principal,
      rate,
      years,
      frequency,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Calculation failed' } as ErrorResponse),
    };
  }
};
