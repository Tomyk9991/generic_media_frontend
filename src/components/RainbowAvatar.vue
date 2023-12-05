<script lang="ts">
import {defineComponent} from 'vue'
import {LOCALSTORAGE_SESSIONTOKEN} from "../utils/Constants";
import {baseURL} from "../services/Service";

export default defineComponent({
    name: "RainbowAvatar",
    props: {
        disableRing: {
            type: Boolean,
            default: false
        },
        src: {
            required: false,
        },
        size: {
            type: Number,
            default: 150
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
        if (this.src) {
            this.url = this.src;
        } else {
            this.getImage()
        }
    },
    methods: {
        async getImage() {
            if (this.userName === '' || this.userName === undefined) {
                return;
            }

            try {
                const response = await fetch(`${baseURL}/user/${this.userName}/avatar`, { method: 'GET', credentials: "include" })
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
    <div class="loader-container">
<!--        TODO still a very small ring visible. maybe v-if one step higher-->
        <div class="loader">
            <div v-if="!disableRing">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>

        <v-avatar class="loader-image" v-if="this.url" :size="this.size" :image="this.url"/>
    </div>

</template>

<style scoped>
.loader-container {
    display: flex;
    justify-content: center;
    align-items: center;
}

.loader {
    position: relative;
    width: 150px;
    height: 150px;
    border-radius: 50%;
    background: linear-gradient(#14ffe9, #ffeb3b, #ff00e0);
    animation: animate 2.0s linear infinite;
}

.loader-image {
    position: absolute;
}

@keyframes animate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.loader span {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(#14ffe9, #ffeb3b, #ff00e0);
}

.loader span:nth-child(1) {
    filter: blur(5px);
}

.loader span:nth-child(2) {
    filter: blur(10px);
}

.loader span:nth-child(3) {
    filter: blur(25px);
}

.loader span:nth-child(4) {
    filter: blur(50px);
}

.loader:after {
    content: '';
    position: absolute;
    top: 10px;
    left: 10px;
    right: 10px;
    bottom: 10px;
    background: #240229;
    border-radius: 50%;
}
</style>