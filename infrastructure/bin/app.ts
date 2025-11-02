#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SimpleCalculatorStack } from '../lib/simple-calculator-stack';

const app = new cdk.App();

new SimpleCalculatorStack(app, 'SimpleCalculatorStack', {
  env: {
    region: 'eu-north-1', // Stockholm
  },
});

app.synth();
