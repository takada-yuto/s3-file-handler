"use client"

import { FileUploader } from "@/components/FileUploader"
import useEnv from "@/lib/useEnv"
import { useState } from "react"
import useSWR from "swr"

export default function Home() {
  const { env } = useEnv()
  // const [createDownloadPresignedUrlFunctionURL, setCloudfrontUrl] = useState("")
  // const fetcher = async () => {
  //   const res = await fetch("/index.html")
  //   console.log(res)
  //   return res.json()
  // }
  const handler = async () => {
    console.log(`env: ${env}`)
    // setCloudfrontUrl(env?.createDownloadPresignedUrlFunctionURL!)
    // const response = await fetch(env?.createDownloadPresignedUrlFunctionURL!)
    // const { data: envIndex } = useSWR("/index.html", fetcher, {
    //   revalidateOnFocus: false,
    //   revalidateOnReconnect: false,
    // })
    // const response = await fetch(env?.createDownloadPresignedUrlFunctionURL!, {
    //   method: "PUT",
    //   body: {
    //     fileName: fileName,
    //   },
    // })
    // console.log(`response: ${response}`)
    // const result = await response.json()
    // console.log(`result: ${result}`)
    // console.log(`result.presignedUrl: ${result.presignedUrl}`)
  }
  function onFileUpload(params: any) {
    console.log(params)
  }
  return (
    <>
      <button className="mr-4" onClick={handler}>
        invoke
      </button>
      {/* {createDownloadPresignedUrlFunctionURL
        ? createDownloadPresignedUrlFunctionURL
        : ""} */}
      <div className="w-full px-8 flex flex-col">
        <FileUploader onFileUpload={onFileUpload} env={env} />
      </div>
    </>
  )
}
