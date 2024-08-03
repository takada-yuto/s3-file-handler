import useSWR from "swr"

interface Env {
  createUploadPresignedUrlFunctionURL: string
  createDownloadPresignedUrlFunctionURL: string
}

const fetcher = async () => {
  const res = await fetch("/env.json")
  return res.json()
}

export default function useEnv() {
  const { data: env } = useSWR<Env>("/env.json", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })

  if (!env) {
    console.log("error")
  }

  return { env: Object.freeze(env) }
}
