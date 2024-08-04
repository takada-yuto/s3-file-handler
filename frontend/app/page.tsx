"use client"
import { FileUploader } from "@/components/FileUploader"
import useEnv from "@/lib/useEnv"

export default function Home() {
  const { env } = useEnv()
  function onFileUpload(params: any) {
    console.log(params)
  }
  return (
    <>
      <div className="w-full p-8 flex flex-col">
        <FileUploader onFileUpload={onFileUpload} env={env} />
      </div>
    </>
  )
}
