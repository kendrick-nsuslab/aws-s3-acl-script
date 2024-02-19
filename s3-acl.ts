import {
    S3Client,
    PutObjectAclCommand,
    PutObjectAclCommandInput,
    S3ClientConfig,
    ListBucketsCommand,
    ListBucketsCommandInput,
    ListBucketsCommandOutput,
    ListObjectsV2Command,
    _Object
} from '@aws-sdk/client-s3'
import { Bucket } from 'aws-sdk/clients/s3'

const MAX_COUNT = 5
let TRY_COUNT = 0

const config: S3ClientConfig = {

}

const CLIENT = new S3Client(config)

enum RECOVER_TYPE {
    UPDATE_ERR = 'UPDATE_ERROR',
    GET_BUCKET_LIST_ERR = "GET_BUCKET_LIST_ERR",
    GET_OBJECT_BY_BUCKET_ERR = 'GET_OBJECT_BUCKET_ERR'
}


const recover = (type: RECOVER_TYPE) => {
    switch (type) {
        case RECOVER_TYPE.GET_BUCKET_LIST_ERR:
            break;
        case RECOVER_TYPE.GET_OBJECT_BY_BUCKET_ERR:
            break;
        case RECOVER_TYPE.UPDATE_ERR:
            break;
        default:
            break;
    }
}

const getBuckets = async (): Promise<ListBucketsCommandOutput> => { // this function could be replaced sqlLite or something
    const option: ListBucketsCommandInput = {}
    const command = new ListBucketsCommand(option)
    return CLIENT.send(command)
}

const getObjectInBucket = async (bucketName: string): Promise<_Object[]> => {
    let isTruncated = true
    let kycObject: _Object[] = []

    const command = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 1
    })

    while (isTruncated) {
        const { Contents, IsTruncated, NextContinuationToken } = await CLIENT.send(command)
        isTruncated = IsTruncated || false
        command.input.ContinuationToken = NextContinuationToken

        if (Contents) {
            kycObject = [...kycObject, ...Contents]
        } else {
            console.error('content not found')
            continue;
        }

    }
    return kycObject
}

const putObjectAcl = async (kycObject: _Object[], bucketName: string): Promise<void> => {
    await Promise.all([
        kycObject.map((x) => CLIENT.send(new PutObjectAclCommand({
            ACL: 'private',
            Key: x.Key as string,
            Bucket: bucketName
        })))
    ])
}

const _wrapper = async (buckets: Bucket[]): Promise<void> => {
    if (buckets.length <= 0) { // all clear buckets
        console.info('bucket not found')
        return
    }

    const bucketName = buckets[0].Name as string // get first bucket
    const kycObject = await getObjectInBucket(bucketName)

    await putObjectAcl(kycObject, bucketName).then(() => {
        buckets.shift() // remove first bucket
        return _wrapper(buckets)
    }).catch((err) => {
        if (TRY_COUNT <= MAX_COUNT) { // try for MAX_COUNT update object in first bucket 
            console.error(`object acl update error: ${err}`)
            TRY_COUNT++
            return _wrapper(buckets)
        } else { // if try count equals max count then skip first bucket
            console.info(`skip ${bucketName}`)
            buckets.shift() // remove first bucket
            TRY_COUNT = 0
            return _wrapper(buckets)
        }

    })
}

const main = async () => {
    const { Buckets } = await getBuckets();
    console.log(`buckets list count:  ${Buckets?.length}`)

    if (!Buckets) return recover(RECOVER_TYPE.GET_BUCKET_LIST_ERR)

    return _wrapper(Buckets)
}



main()