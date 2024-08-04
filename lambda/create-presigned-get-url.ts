import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const client = new S3Client({
  region: process.env.REGION,
})

const getPresignedUrl = async (
  bucket: string,
  key: string,
  expiresIn: number
): Promise<string> => {
  const objectParams = {
    Bucket: bucket,
    Key: key,
  }
  const signedUrl = await getSignedUrl(
    client,
    new GetObjectCommand(objectParams),
    { expiresIn }
  )
  console.log(signedUrl)
  return signedUrl
}

export const handler = async (event) => {
  // const id = event.arguments.id
  console.log(event)
  const body = event.body
  console.log(body)
  let fileName: string | undefined
  let currentTime: string | undefined

  try {
    const { fileName: fn, currentTime: ct } = JSON.parse(body)
    if (typeof fn !== "string" || typeof ct !== "string") {
      throw new Error("Invalid properties")
    }
    fileName = fn
    currentTime = ct
  } catch (error) {
    console.error("Failed to parse body or retrieve properties:", error)
  }
  const { REGION, BUCKET, EXPIRES_IN } = process.env

  if (!REGION || !BUCKET || !EXPIRES_IN || isNaN(Number(EXPIRES_IN))) {
    throw new Error("invalid environment values")
  }

  const expiresIn = Number(EXPIRES_IN)
  const filePath = `files/${currentTime}/${fileName}`
  console.log(BUCKET)
  console.log(expiresIn)
  console.log(filePath)

  const url = await getPresignedUrl(BUCKET, filePath, expiresIn)

  return {
    bucket: BUCKET,
    filePath: filePath,
    presignedUrl: url,
  }
}
