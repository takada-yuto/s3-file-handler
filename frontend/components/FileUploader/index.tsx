"use client"
import { FC, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
interface Env {
  createUploadPresignedUrlFunctionURL: string
  createDownloadPresignedUrlFunctionURL: string
  fileBucketUrl: string
  cloudfrontUrl: string
}
type Props = {
  onFileUpload: ({
    data,
    file_name,
  }: {
    data: string
    file_name: string
  }) => void
  env: Readonly<Env | undefined>
}

export const FileUploader: FC<Props> = ({ onFileUpload, env }) => {
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/api/env")
      if (!response.ok) {
        throw new Error("Network response was not ok")
      }
      const data = await response.json()
      console.log("data", data)
    }

    fetchData()
  }, [])
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const envResponse = await fetch("/env.json")
      const data = await envResponse.json()
      console.log(data)
      const file = acceptedFiles[0]
      const now = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
      )

      const pad = (num: number) => String(num).padStart(2, "0")
      const currentTime = `${now.getFullYear()}-${pad(
        now.getMonth() + 1
      )}-${pad(now.getDate())}-${pad(now.getHours())}${pad(
        now.getMinutes()
      )}${pad(now.getSeconds())}`

      console.log(currentTime)
      console.log(file.type)
      console.log(file.name)
      const response = await fetch(env?.createUploadPresignedUrlFunctionURL!, {
        method: "PUT",
        body: JSON.stringify({
          fileName: file.name,
          currentTime: currentTime,
        }),
      })
      const result = await response.json()
      console.log(`result.presignedUrl: ${result.presignedUrl}`)
      const uploadResponse = await fetch(result.presignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      })

      const bucketUrl = `${env?.fileBucketUrl}/${result.filePath}`

      // S3にファイルが存在するか確認
      const checkFileExists = async (retries = 5) => {
        for (let i = 0; i < retries; i++) {
          const headResponse = await fetch(bucketUrl, { method: "HEAD" })
          if (headResponse.ok) {
            return true
          }
          await new Promise((resolve) => setTimeout(resolve, 1000)) // 1秒待つ
        }
        return false
      }

      const fileExists = await checkFileExists()
      if (!fileExists) {
        throw new Error("File not uploaded to S3 in time")
      }

      const downloadResponse = await fetch(
        env?.createDownloadPresignedUrlFunctionURL!,
        {
          method: "PUT",
          body: JSON.stringify({
            fileName: file.name,
            currentTime: currentTime,
          }),
        }
      )
      const downloadResult = await downloadResponse.json()
      console.log(`downloadResult.presignedUrl: ${downloadResult.presignedUrl}`)
      const downloadResultResponse = await fetch(downloadResult.presignedUrl)
      const blob = await downloadResultResponse.blob()

      // バケット分けない場合
      // const downloadResultResponse = await fetch(result.filePath)
      // const blob = await downloadResultResponse.blob()

      const downloadUrl = URL.createObjectURL(blob)
      console.log(`downloadUrl: ${downloadUrl}`)

      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)
    },
    [onFileUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  return (
    <>
      <div
        {...getRootProps()}
        style={{
          border: "dashed",
          backgroundColor: "white",
          height: "200px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          margin: "0 20px",
        }}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-center p-3 m-0">ここにファイルをドロップ</p>
        ) : (
          <p className="text-center p-3 m-0">
            ここにファイルをドロップ
            <br />
            またはクリックでファイルを選択
          </p>
        )}
      </div>
    </>
  )
}
