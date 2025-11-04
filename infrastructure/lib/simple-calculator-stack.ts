import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import * as path from 'path';

/**
 * Simple Calculator Stack
 * 
 * Single stack containing:
 * - S3 bucket with static website (HTML/JS frontend)
 * - Lambda function (Dockerized TypeScript backend in separate backend/ folder)
 * - API Gateway (REST API)
 */
export class SimpleCalculatorStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda function for calculation (Dockerized TypeScript)
    const calculateFn = new lambda.DockerImageFunction(this, 'CalculateFunction', {
      code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../../backend'), {
        platform: cdk.aws_ecr_assets.Platform.LINUX_ARM64, // Build for ARM64
      }),
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      architecture: lambda.Architecture.ARM_64, // AWS Graviton2 (cheaper, faster)
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'CalculatorApi', {
      restApiName: 'simple-calculator-api',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const calculateResource = api.root.addResource('calculate');
    calculateResource.addMethod('POST', new apigateway.LambdaIntegration(calculateFn));

    // S3 bucket for static website
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Deploy frontend to S3
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../frontend'))],
      destinationBucket: websiteBucket,
    });

    // Outputs
    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: websiteBucket.bucketWebsiteUrl,
      description: 'Website URL',
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint',
    });
  }
}
