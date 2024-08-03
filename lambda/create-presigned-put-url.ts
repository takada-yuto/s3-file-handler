import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
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
    new PutObjectCommand(objectParams),
    { expiresIn }
  )
  console.log(signedUrl)
  return signedUrl
}

export const handler = async (event) => {
  // const id = event.arguments.id
  console.log(event)
  const file_name = event["body"]["fileName"]
  console.log(file_name)
  const body = event.body
  console.log(body)
  let fileName: string | undefined
  try {
    // JSON文字列をパースしてオブジェクトに変換
    const parsedBody = JSON.parse(body)

    // fileNameプロパティが存在するかチェック
    if (parsedBody && typeof parsedBody.fileName === "string") {
      fileName = parsedBody.fileName
    } else {
      throw new Error("Invalid fileName property")
    }
  } catch (error) {
    console.error("Failed to parse body or retrieve fileName:", error)
    fileName = undefined
  }
  const { REGION, BUCKET, EXPIRES_IN } = process.env

  if (!REGION || !BUCKET || !EXPIRES_IN || isNaN(Number(EXPIRES_IN))) {
    throw new Error("invalid environment values")
  }

  const expiresIn = Number(EXPIRES_IN)
  // const key = `files/${id}/${file_name}`
  const key = `files/${fileName}`
  console.log(BUCKET)
  console.log(expiresIn)
  console.log(key)

  const url = await getPresignedUrl(BUCKET, key, expiresIn)

  return {
    bucket: BUCKET,
    key: `https://${key}`,
    presignedUrl: url,
  }
}
