import { convertToAscii } from "./utils";
import { getEmbeddings } from "./embeddings";
import { Pinecone } from "@pinecone-database/pinecone";

export async function getMatchesFromEmbeddings(embeddings: number[], fileKey: string) {

    try {
        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!
        })
        const index = await pinecone.index("chatpdf-yt")
        const namespace = convertToAscii(fileKey)
        const queryResult = await index.namespace(namespace).query({
            topK: 5,
            vector: embeddings,
            includeMetadata: true,
        })

        return queryResult.matches || []
    } catch (error) {
        console.log("error querying embeddings", error)
        throw error;
    }

}

export async function getContext(query: string, fileKey: string) {
    const queryEmbeddings = await getEmbeddings(query)
    const matches = await getMatchesFromEmbeddings(queryEmbeddings, fileKey)

    const qualifyingDocs = matches.filter((match) => match.score && match.score > 0.7)

    type Metadata = {
        text: string,
        pageNumber: number
    }

    const docs = qualifyingDocs.map((match) => (match.metadata as Metadata).text)
    // 5 vectors
    return docs.join("\n").substring(0, 3000)
}

