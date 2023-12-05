<script lang="ts">
import {defineComponent} from 'vue'
import {LOCALSTORAGE_SESSIONTOKEN} from "../utils/Constants";
import {baseURL} from "../services/Service";

export default defineComponent({
    name: "AuthenticatedVideo",
    props: {
        src: {
            type: String,
            required: true
        },
        userName: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            os: '' as string,
            url: '' as unknown
        }
    },
    created() {
        this.getImage()
    },
    methods: {
        async getImage() {
            if (this.src === undefined || this.src === '') {
                return;
            }

            try {
                const token = localStorage.getItem(LOCALSTORAGE_SESSIONTOKEN);
                const headers = { Authorization: 'Bearer ' + token };
                const response = await fetch(`${baseURL}/media/${this.userName}/${this.src}`, { method: 'GET', headers: headers, credentials: "include" })
                const data = await response.blob();

                this.url = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(data);
                });
            } catch (e) {
                console.log(`Error: ${e}`);
            }
        }
    }
})


</script>

<template>
    <video muted playsinline controls :src="this.url" type="video/mp4" style="height: 100%">
    </video>
</template>

<style scoped>

</style>