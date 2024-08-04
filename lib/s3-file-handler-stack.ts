import * as cdk from "aws-cdk-lib"
import {
  CloudFrontWebDistribution,
  OriginAccessIdentity,
} from "aws-cdk-lib/aws-cloudfront"
import { AnyPrincipal, Effect, PolicyStatement } from "aws-cdk-lib/aws-iam"
import { Runtime } from "aws-cdk-lib/aws-lambda"
import { BlockPublicAccess, Bucket, HttpMethods } from "aws-cdk-lib/aws-s3"
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment"
import { Construct } from "constructs"

export class S3FileHandlerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const frontendBucket = new Bucket(this, "CdkTemplateFrontendBucket", {
      websiteIndexDocument: "index.html",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
      // cors: [ // バケット分けない場合
      //   {
      //     allowedHeaders: ["*"],
      //     allowedMethods: [HttpMethods.GET, HttpMethods.PUT],
      //     allowedOrigins: ["*"],
      //   },
      // ],
    })

    const policyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["s3:GetObject"],
      principals: [new AnyPrincipal()],
      resources: [frontendBucket.arnForObjects("*")],
    })
    frontendBucket.addToResourcePolicy(policyStatement)

    const fileBucket = new Bucket(this, "FileBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [HttpMethods.GET, HttpMethods.PUT, HttpMethods.HEAD],
          allowedOrigins: ["*"],
        },
      ],
    })
    const fileBucketPolicyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["s3:GetObject"],
      principals: [new AnyPrincipal()],
      resources: [fileBucket.arnForObjects("*")],
    })
    fileBucket.addToResourcePolicy(fileBucketPolicyStatement)

    const iamRoleForLambda = new cdk.aws_iam.Role(this, "iamRoleForLambda", {
      assumedBy: new cdk.aws_iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    })

    fileBucket.grantPut(iamRoleForLambda)
    fileBucket.grantRead(iamRoleForLambda)
    frontendBucket.grantPut(iamRoleForLambda)
    frontendBucket.grantRead(iamRoleForLambda)

    const cdkTemplateOAI = new OriginAccessIdentity(
      this,
      "CdkTemplateFrontendOAI"
    )
    frontendBucket.grantRead(cdkTemplateOAI)
    fileBucket.grantRead(cdkTemplateOAI)

    const distribution = new CloudFrontWebDistribution(
      this,
      "CdkTemplateFrontendWebDestribution",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: frontendBucket,
              originAccessIdentity: cdkTemplateOAI,
            },
            behaviors: [
              {
                isDefaultBehavior: true,
              },
            ],
          },
        ],
      }
    )

    const cloudfrontUrl = `https://${distribution.distributionDomainName}`

    const createUploadPresignedUrlLambda =
      new cdk.aws_lambda_nodejs.NodejsFunction(
        this,
        "CreateUploadPresignedUrlLambda",
        {
          entry: "lambda/create-presigned-put-url.ts",
          handler: "handler",
          runtime: Runtime.NODEJS_20_X,
          role: iamRoleForLambda,
          environment: {
            REGION: this.region,
            // BUCKET: frontendBucket.bucketName,
            BUCKET: fileBucket.bucketName, // バケット分けて保存する場合
            EXPIRES_IN: "3600",
            CLOUDFRONT_URL: cloudfrontUrl,
          },
        }
      )

    frontendBucket.grantReadWrite(createUploadPresignedUrlLambda)
    fileBucket.grantReadWrite(createUploadPresignedUrlLambda)

    const createUploadPresignedUrlFunctionURL =
      createUploadPresignedUrlLambda.addFunctionUrl({
        authType: cdk.aws_lambda.FunctionUrlAuthType.NONE,
        cors: {
          allowedOrigins: ["*"],
          allowedMethods: [
            cdk.aws_lambda.HttpMethod.GET,
            cdk.aws_lambda.HttpMethod.POST,
            cdk.aws_lambda.HttpMethod.PUT,
          ],
          allowedHeaders: ["*"],
        },
      })
    const createDownloadPresignedUrlLambda =
      new cdk.aws_lambda_nodejs.NodejsFunction(
        this,
        "CreateDownloadPresignedUrlLambda",
        {
          entry: "lambda/create-presigned-get-url.ts",
          handler: "handler",
          runtime: Runtime.NODEJS_20_X,
          role: iamRoleForLambda,
          environment: {
            REGION: this.region,
            // BUCKET: frontendBucket.bucketName,
            BUCKET: fileBucket.bucketName, // バケット分けて保存する場合
            EXPIRES_IN: "3600",
            CLOUDFRONT_URL: cloudfrontUrl,
          },
        }
      )

    frontendBucket.grantReadWrite(createDownloadPresignedUrlLambda)
    fileBucket.grantReadWrite(createDownloadPresignedUrlLambda)

    const createDownloadPresignedUrlFunctionURL =
      createDownloadPresignedUrlLambda.addFunctionUrl({
        authType: cdk.aws_lambda.FunctionUrlAuthType.NONE,
        cors: {
          allowedOrigins: ["*"], // 必要に応じて、特定のオリジンに制限
          allowedMethods: [
            cdk.aws_lambda.HttpMethod.GET,
            cdk.aws_lambda.HttpMethod.POST,
            cdk.aws_lambda.HttpMethod.PUT,
          ], // 使用するHTTPメソッドを指定
          allowedHeaders: ["*"], // 必要に応じて、特定のヘッダーに制限
        },
      })

    // CloudFrontディストリビューションのドメイン名を出力
    new cdk.CfnOutput(this, "cloudfrontUrl", {
      value: cloudfrontUrl,
    })

    new BucketDeployment(this, "CdkTemplateFrontendBucketDeployment", {
      sources: [
        Source.asset("frontend/out"),
        Source.jsonData("env.json", {
          createUploadPresignedUrlFunctionURL:
            createUploadPresignedUrlFunctionURL.url,
          createDownloadPresignedUrlFunctionURL:
            createDownloadPresignedUrlFunctionURL.url,
          fileBucketUrl: `https://${fileBucket.bucketName}.s3.amazonaws.com`,
        }),
      ],
      destinationBucket: frontendBucket,
      distribution: distribution,
      distributionPaths: ["/*"],
    })
  }
}
