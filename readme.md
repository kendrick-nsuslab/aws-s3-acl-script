## KYC file 접근 제한


### goal
    1. kYC을 위해 올린 s3 파일들의 ACL을 private로 변경한다.
### info
    1. KYC 파일의 위치
       ex) /{env}/20231215053326/7c95c04498b94a1581622d63551dc0c7/f9baaa3363c743fb9f6e161fbda364f1.jpg
### flow
    가안 1. database `PlayerKycDocument`에서 `DocumentRemotePath`을 통해서 파일을 하나씩 ACL을 업데이트한다. (첨부 1 참고)
    가안 2. script가 aws 버킷에 접근해서 자체적으로 파일의 키를 알아내 ACL 업데이트를한다. (첨부 2 참고)
### detail 

### execute
   1. npm run build ./{fileName}.ts
   2. node {fileName}.js 

---
참고 1
---
문제점
   1. 모든 파일을 돌리기 위해 지속적으로 database를 물고 있어야 한다. (코드단에서 수정할 수 있을듯)
   2. S3에는 있고 DB에는 없는 데이터는 ACL 업데이트가 불가하다.


참고 2
---
문제점
   1. 트래픽 비용이 추가 될 수 있다. (script가 버킷을 탐색하기 때문)
   2. aws-sdk가 bucket list를 불러 올 때 limit을 걸 수 없다.\
      i. 초기 한번만 가지고 저장 후 사용 해야 될듯하다.\
           (redis, sqlLite, json)
         


---
[object ACL update](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/command/PutObjectAclCommand)