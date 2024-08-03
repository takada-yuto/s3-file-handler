"use client"
import useEnv from "@/lib/useEnv"
import { FC, useCallback, useEffect, useState } from "react"
import { useDropzone } from "react-dropzone"
import { v4 as uuid } from "uuid"
interface Env {
  createUploadPresignedUrlFunctionURL: string
  createDownloadPresignedUrlFunctionURL: string
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
  // const [url, setUrl] = useState<string | undefined>(undefined)
  // const [file, setFile] = useState<File | null>(null)
  // const [createUploadPresignedUrl] = useCreateUploadPresignedUrlMutation()
  // const [createDownloadPresignedUrl] = useCreateDownloadPresignedUrlMutation()
  // const [audToTxt] = useAudToTxtMutation()
  // const uploadFile = async (
  //   putData: PresignedUrl,
  //   getData: PresignedUrl,
  //   file: File
  // ) => {
  //   console.log(putData)
  //   console.log(file)
  //   const fileUploadResponse = await fetch(putData.presignedUrl, {
  //     method: "PUT",
  //     headers: {
  //       "Content-Type": file.type,
  //     },
  //     body: file,
  //   })
  //   console.log(fileUploadResponse)
  //   console.log(getData.presignedUrl)
  //   const { data: audData } = await audToTxt({
  //     variables: { presignedUrl: getData.presignedUrl },
  //   })
  //   console.log(audData)
  //   // const fileDownloadResponse = await fetch(getData.presignedUrl, {
  //   //   method: "GET",
  //   //   headers: {
  //   //     "Content-Type": file.type,
  //   //   },
  //   // })
  //   // console.log(fileDownloadResponse)
  //   // const blob = await fileDownloadResponse.blob()
  //   // console.log(blob)
  // }
  // const { env } = useEnv()
  const [createDownloadPresignedUrlFunctionURL, setCloudfrontUrl] = useState("")
  const [downloadUrl, setDownloadUrl] = useState("")
  const [fileName, setFileName] = useState("")
  const download = async (url: string, fileName: string | undefined) => {
    const downloadResponse = await fetch(url, {
      method: "PUT",
      body: JSON.stringify({
        fileName: fileName,
      }),
    })
    console.log(`downloadResponse: ${downloadResponse}`)
    const downloadResult = await downloadResponse.json()
    console.log(`downloadResult: ${downloadResult}`)
    console.log(`downloadResult.presignedUrl: ${downloadResult.presignedUrl}`)
    const downloadResultResponse = await fetch(downloadResult.presignedUrl)
    console.log(`downloadResultResponse: ${downloadResultResponse}`)
    console.log(`downloadResultResponse: ${downloadResultResponse}`)
    const blob = await downloadResultResponse.blob()
    // const indexResponse = await fetch(result.key)
    // console.log(`indexResponse: ${indexResponse}`)
    // const blob = await indexResponse.blob()

    // BlobをObject URLに変換
    const audioObjectUrl = URL.createObjectURL(blob)
    console.log(`audioObjectUrl: ${audioObjectUrl}`)

    // const url = URL.createObjectURL(selectedFile)
    const link = document.createElement("a")
    link.href = audioObjectUrl
    link.download = fileName as string
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(audioObjectUrl)
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      console.log(acceptedFiles)
      console.log(file.name)
      const guid = uuid()
      // try {
      //   const { data: putData } = await createUploadPresignedUrl({
      //     variables: { filename: file.name, id: guid },
      //   })

      //   const { data: getData } = await createDownloadPresignedUrl({
      //     variables: { filename: file.name, id: guid },
      //   })
      //   console.log(putData)
      //   console.log(getData)
      //   await uploadFile(
      //     putData!.createUploadPresignedUrl!,
      //     getData!.createDownloadPresignedUrl!,
      //     file
      //   )
      // } catch (error) {
      //   console.log(error)
      // }
      console.log(`env: ${env}`)
      setCloudfrontUrl(env?.createUploadPresignedUrlFunctionURL!)
      // const response = await fetch(env?.createUploadPresignedUrlFunctionURL!)
      const response = await fetch(env?.createUploadPresignedUrlFunctionURL!, {
        method: "PUT",
        body: JSON.stringify({
          fileName: file.name,
        }),
      })
      console.log(`response: ${response}`)
      const result = await response.json()
      console.log(`result: ${result}`)
      console.log(`result.presignedUrl: ${result.presignedUrl}`)
      const uploadResponse = await fetch(result.presignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      })
      console.log(`uploadResponse: ${uploadResponse}`)
      setDownloadUrl(env?.createDownloadPresignedUrlFunctionURL!)
      setFileName(file.name)
      // const uploadResponseResult = await uploadResponse.json()
      // console.log(`uploadResponseResult: ${uploadResponseResult}`)

      // const downloadResponse = await fetch(
      //   env?.createDownloadPresignedUrlFunctionURL!,
      //   {
      //     method: "PUT",
      //     body: JSON.stringify({
      //       fileName: file.name,
      //     }),
      //   }
      // )
      // console.log(`downloadResponse: ${downloadResponse}`)
      // const downloadResult = await downloadResponse.json()
      // console.log(`downloadResult: ${downloadResult}`)
      // console.log(`downloadResult.presignedUrl: ${downloadResult.presignedUrl}`)
      // const downloadResultResponse = await fetch(downloadResult.presignedUrl)
      // console.log(`downloadResultResponse: ${downloadResultResponse}`)
      // console.log(`downloadResultResponse: ${downloadResultResponse}`)
      // const blob = await downloadResultResponse.blob()
      // // const indexResponse = await fetch(result.key)
      // // console.log(`indexResponse: ${indexResponse}`)
      // // const blob = await indexResponse.blob()

      // // BlobをObject URLに変換
      // const audioObjectUrl = URL.createObjectURL(blob)
      // console.log(`audioObjectUrl: ${audioObjectUrl}`)

      // // const url = URL.createObjectURL(selectedFile)
      // const link = document.createElement("a")
      // link.href = audioObjectUrl
      // link.download = file.name
      // document.body.appendChild(link)
      // link.click()
      // document.body.removeChild(link)
      // URL.revokeObjectURL(audioObjectUrl)
    },
    [onFileUpload]
  )

  // これをベースにする
  // useEffect(() => {
  //   const uploadFile = async () => {
  //     if (url && file) {
  //       // URLとファイルが設定されている場合に実行
  //       try {
  //         const fileUploadResponse = await fetch(url, {
  //           method: "PUT",
  //           body: file, // FormDataではなくファイルだけをアップロード
  //           headers: {
  //             "Access-Control-Allow-Origin": "*",
  //             "Content-Type": file.type, // 必要に応じてコンテンツタイプを設定
  //           },
  //         })

  //         if (fileUploadResponse.ok) {
  //           console.log("File uploaded successfully")
  //         } else {
  //           console.error("File upload failed", fileUploadResponse.statusText)
  //         }
  //       } catch (error) {
  //         console.error("Error uploading file:", error)
  //       }
  //     }
  //   }
  //   uploadFile()
  // }, [url, file])

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
        {/* <FontAwesomeIcon icon={faUpload} style={{ fontSize: 50 }} /> */}
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
      <div>
        {downloadUrl ? (
          <button onClick={() => download(downloadUrl, fileName)}>
            Download Audio
          </button>
        ) : (
          ""
        )}
      </div>
    </>
  )
}
