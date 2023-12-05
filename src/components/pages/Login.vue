<script lang="ts">
import {defineComponent, inject} from 'vue'
import {AuthenticatedService, BackendService} from "../../services/Service";
import {LOCALSTORAGE_USERNAME} from "../../utils/Constants";

export default defineComponent({
    name: "Login",
    data() {
        return {
            password: '',
            userName: '',
            c: {},
            loginRequested: false,
            backendService: { } as BackendService<string>,
            authenticatedService: { } as AuthenticatedService<string> | undefined,
            message: 'Falsche Eingabe',
            showPasswordInvalidLabel: false
        }
    },
    async created() {
        this.backendService = (inject("backendService")) as BackendService<string>;

        if (localStorage.getItem("loggedIn") === "loggedIn") {
            if (await this.backendService.revalidate()) {
                this.showPasswordInvalidLabel = false;
                this.loginRequested = true;

                this.$router.push(`/friends`);
            }
        }
    },
    beforeRouteLeave(to, from, next) {
        if (this.loginRequested) {
            next();
        }
    },
    methods: {
        async onUnlock() {
            let s = await this.backendService.authenticate_with_message(this.userName, this.password);

            if (s instanceof AuthenticatedService<string>) {
                localStorage.setItem(LOCALSTORAGE_USERNAME, this.userName);

                this.showPasswordInvalidLabel = false;
                this.loginRequested = true;

                localStorage.setItem("loggedIn", "loggedIn");
                this.$router.push(`/friends`);
                return;
            } else {
                let f = s as string;
                localStorage.removeItem(LOCALSTORAGE_USERNAME);
                this.showPasswordInvalidLabel = true;
                this.message = f;

                setTimeout(() => {
                    this.showPasswordInvalidLabel = false;
                }, 5000);
            }
        }
    }
})
</script>

<template>
    <div class="v-container mt-5">
        <!--        Locked header-->
        <div class="d-flex justify-center">
            <v-icon style="font-size: 60px">mdi-lock</v-icon>
        </div>
        <div class="d-flex justify-center">
            Logge dich ein
        </div>

        <div class="mt-5">
            <div class="mx-5 px-5">
                <v-text-field clearable placeholder="Nutzernamen eingeben..." label="E-Mail"  variant="outlined" ref="passwordInput" @keyup.enter="onUnlock" type="email" v-model="userName"/>
                <v-text-field clearable placeholder="Passwort eingeben..." label="Passwort" variant="outlined" ref="passwordInput" @keyup.enter="onUnlock" type="password" v-model="password"/>
                <v-label v-if="showPasswordInvalidLabel" wrap class="d-flex text-wrap mt-0 justify-center text-red">{{this.message}}</v-label>
            </div>
        </div>


        <div class="d-flex justify-center mt-3">
            <v-btn @click="onUnlock" class="me-1">Entsperren</v-btn>
        </div>
    </div>
</template>

<style scoped>

</style>