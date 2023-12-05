<script lang="ts">
import {defineComponent, inject} from 'vue'

import {AuthenticatedService, BackendService, baseURL} from "../../services/Service";
import AuthenticatedImage from "../AuthenticatedImage.vue";
import AuthenticatedVideo from "../AuthenticatedVideo.vue";
import UserProfile from "../../models/UserProfile";
import ImageVideoGridChild from "./ImageVideoGridChild.vue";

export default defineComponent({
    name: "Explorer",
    components: {ImageVideoGridChild, AuthenticatedVideo, AuthenticatedImage},
    data() {
        return {
            userName: '',
            AMOUNT_COLUMNS: 3,
            AMOUNT_ROWS: 3,
            authenticatedService: {} as AuthenticatedService<string> | undefined,
            fullProfile: {} as UserProfile,
            amountPages: 0 as number,
            highlightedImage: '' as string,
            page: 1,
            data: [] as string[],
        }
    },
    async created() {
        this.userName = this.$route.params.user as string;

        if (this.$route.query.page == undefined) {
            let url = window.location.href.split('?')[0];
            url = url.replace("/list", "");
            history.pushState({}, '', url + "?page=" + 1);

            this.$route.query.page = '1';
        } else {
            let url = window.location.href.split('?')[0];
            url = url.replace("/list", "");
            this.page = parseInt(this.$route.query.page as string);
            history.pushState({}, '', url + "?page=" + this.page);
        }


        let backendService = (inject("backendService")) as BackendService<string>;
        this.authenticatedService = new AuthenticatedService<string>();

        if (await backendService.revalidate()) {
            this.fullProfile = await this.authenticatedService.getFullProfileInformation(this.userName);
            this.amountPages = Math.ceil(Math.max(this.fullProfile.amount_posts == undefined ? 0 : this.fullProfile.amount_posts / (this.AMOUNT_ROWS * this.AMOUNT_COLUMNS), 1));
        } else {
            await this.logout();
        }

        await this.updateDataWithPage((this.page - 1) * this.AMOUNT_COLUMNS * this.AMOUNT_ROWS);
    },
    watch: {
        page: async function (page: number, _oldPage: number) {
            let url = window.location.href.split('?')[0];
            history.pushState({}, '', url + "?page=" + page);

            page = page - 1;
            let perPage = this.AMOUNT_ROWS * this.AMOUNT_COLUMNS;


            await this.updateDataWithPage(page * perPage);

            let currentPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
            let scrollStep = Math.PI / (1 / 10);

            let scrollAnimation = () => {
                if (window.scrollY !== 0) {
                    currentPosition -= scrollStep;
                    let newPosition = currentPosition > 0 ? Math.floor(currentPosition) : 0;

                    window.scrollTo(0, newPosition);
                    window.requestAnimationFrame(scrollAnimation);
                }
            }


            // Start the animation
            window.requestAnimationFrame(scrollAnimation);
        },
    },
    methods: {
        async updateDataWithPage(page: number) {
            if (this.authenticatedService != undefined) {
                this.data = await this.authenticatedService.getContentPagination(this.userName, this.AMOUNT_ROWS * this.AMOUNT_COLUMNS, page);
            } else {
                console.log("not authenticated");
            }
        },
        async logout() {
            if (this.authenticatedService != undefined) {
                await this.authenticatedService.logout();
                this.$router.push("/");
            }
        },
        imageByRowAndColumn(row: number, column: number): any {
            row -= 1;
            column -= 1;

            if (row < 0 || row >= this.AMOUNT_ROWS) {
                console.error(`Can't index with row: ${row}`);
                return '';
            }

            if (column < 0 || column >= this.AMOUNT_COLUMNS) {
                console.error(`Can't index with column: ${column}`);
                return '';
            }


            let number = (row * this.AMOUNT_COLUMNS) + column;

            if (this.data[number] === undefined) {
                return '';
            }

            return `${baseURL}/media/${this.userName}/${this.data[number]}`;
        }
    }
})
</script>

<template>
    <div v-if="this.fullProfile.amount_posts == 0" class="v-container mt-5">
        <div class="d-flex justify-center">
            <div>
                Leider hat dieses Profil noch keine Beiträge
                <v-img src="https://cdn.frankerfacez.com/emoticon/231552/4"></v-img>
            </div>
        </div>
    </div>


<!--    overlay-->
    <div class="overlay" v-if="this.highlightedImage" @click="this.highlightedImage = undefined">
        <ImageVideoGridChild :not-cover="true" :src="this.highlightedImage" :key="this.highlightedImage" style="width: 90%; position:absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);" />
    </div>

    <div v-for="i in (Math.min(this.AMOUNT_ROWS, Math.ceil(this.data.length / this.AMOUNT_COLUMNS)))" :key="i + 400">
        <v-row no-gutters>
            <v-col class="mx-1 my-1" v-for="j in (Math.min(this.AMOUNT_COLUMNS, this.data.length < this.AMOUNT_COLUMNS ? this.AMOUNT_COLUMNS : this.data.length))" :key="(i * this.AMOUNT_COLUMNS) + j">
                <ImageVideoGridChild @update:modelValue="newValue => this.highlightedImage = newValue" :src="this.imageByRowAndColumn(i, j)" style="width: 100%; height: 100%; aspect-ratio: 1 / 1; object-fit: cover"/>
            </v-col>
        </v-row>
    </div>

    <v-pagination v-model="this.page" :length="this.amountPages"/>
</template>

<style scoped>
.overlay {
    position: fixed;
    display: block;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0,0,0,0.5);
    z-index: 2;
    cursor: pointer;
}
</style>