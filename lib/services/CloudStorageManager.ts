import { getStorage, ref, uploadBytesResumable, getDownloadURL, getMetadata } from "firebase/storage";
import { auth } from '../config/firebase';

enum BucketReference {
    publicRef = "gs://sayit-b44d5-pub",
    privateRef = "gs://sayit-b44d5.appspot.com"
}

class CloudStorageManager {
    private storage = getStorage();

    async uploadFile(name: string, blob: Blob, reference: BucketReference = BucketReference.privateRef) {
        let uid = "";
        const currentUser = auth.currentUser;

        if (currentUser) {
            uid = currentUser.uid;
        }

        let firebasePath = "/data/" + name;
        if (reference === BucketReference.privateRef && uid) {
            firebasePath = `${uid}${firebasePath}`;
        }

        const storageRef = ref(this.storage, firebasePath);
        const uploadTask = uploadBytesResumable(storageRef, blob);
        
        return new Promise((resolve, reject) => {
            uploadTask.on("state_changed",
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`Upload is ${progress}% done`);
                },
                (error) => {
                    console.error(error);
                    reject(error);
                },
                () => {
                    console.log("Upload is complete");
                    resolve(uploadTask.snapshot.ref);
                }
            );
        });
    }

    async getFileURL(name: string, reference: BucketReference = BucketReference.privateRef) {
        let uid = "";
        const currentUser = auth.currentUser;

        if (currentUser) {
            uid = currentUser.uid;
        }

        let firebasePath = "/data/" + name;
        if (reference === BucketReference.privateRef && uid) {
            firebasePath = `${uid}${firebasePath}`;
        }

        const storageRef = ref(this.storage, firebasePath);
        
        try {
            const url = await getDownloadURL(storageRef);
            return url;
        } catch (error) {
            console.error(`Error getting download URL: ${error}`);
            return "";
        }
    }
}

const cloudStorageManager = new CloudStorageManager();
export default cloudStorageManager; 