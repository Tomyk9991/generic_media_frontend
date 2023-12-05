<script lang="ts">
import {defineComponent} from 'vue'
import {LOCALSTORAGE_SESSIONTOKEN} from "../utils/Constants";
import {baseURL} from "../services/Service";

export default defineComponent({
    name: "AuthenticatedImage",
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
    <v-img cover :src="this.url">
        <template v-if="src !== ''" v-slot:placeholder>
            <div class="d-flex align-center justify-center fill-height">
                <v-progress-circular color="white" indeterminate/>
            </div>
        </template>
    </v-img>
</template>

<style scoped>
</style>