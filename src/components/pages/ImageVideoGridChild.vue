<template>
    <video muted playsinline controls :key="this.toVideoString(this.src)" v-if="isVideoFormat(this.toVideoString(this.src)) && this.notCover" :src="this.toVideoString(this.src)"
           type="video/mp4" :style="this.style" style="height: 90%"/>

    <div @click="$emit('update:modelValue', this.src)" class="video-container"
         v-if="isVideoFormat(this.toVideoString(this.src)) && !this.notCover">
        <video :key="this.toVideoString(this.src)" :src="this.toVideoString(this.src)" type="video/mp4" class="video-player" :style="this.style"/>
        <v-icon class="play-icon" size="5vw">mdi-play</v-icon>
        <v-icon v-if="this.multiple" class="multiple-icon-video" size="5vw">mdi-card-multiple</v-icon>
    </div>
    <v-img @click="$emit('update:modelValue', this.src)" :cover="!this.notCover" :key="this.toVideoString(this.src)" :style="this.style"
           v-if="!isVideoFormat(this.toVideoString(this.src))" :src="this.toVideoString(this.src)">

        <div v-if="this.multiple" class="icon-div" style="position: absolute; top: 10px; right: 10px;">
            <v-icon size="5vw">mdi-card-multiple</v-icon>
        </div>

        <template v-if="this.toVideoString(this.src) !== ''" v-slot:placeholder>
            <div class="d-flex align-center justify-center fill-height">
                <v-progress-circular color="white" indeterminate/>
            </div>
        </template>

        <template v-if="this.toVideoString(this.src) === 'empty'" v-slot:placeholder>
            <div class="d-flex align-center justify-center fill-height">
                <v-icon>mdi mdi-signature-image</v-icon>
            </div>
        </template>
    </v-img>
</template>
<script lang="ts">
export default {
    name: 'ImageVideoGridChild',
    emits: ['update:modelValue'],
    props: ['modelValue', 'src', 'style', 'notCover', 'multiple'],
    methods: {
        isVideoFormat(source: string): boolean {
            if (source !== undefined) {
                let s = source.toLowerCase();
                return s.endsWith('.mp4') || s.endsWith('.mov') || s.endsWith("m4v");
            }

            return false;
        },
        toVideoString(source: string | string[]): string {
            if(Array.isArray(source)) {
                if (source.length == 0) {
                    return 'empty'
                }
                return source[0];
            } else {
                return source;
            }
        }
    },
}
</script>
<style scoped>
.video-container {
    position: relative;
}

.video-player {
    width: 100%;
    height: auto;
}

.play-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.multiple-icon-video {
    position: absolute;
    top: 10px; right: 10px;
}
</style>