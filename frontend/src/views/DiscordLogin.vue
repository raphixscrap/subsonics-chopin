<script setup lang="ts">

import LogoIcon from "../assets/Icons/LogoIcon.vue";
import Button from "../items/Button.vue";
import DiscordLogo from "../assets/Icons/DiscordLogo.vue";
import router from "../router.ts";

function login() {
  console.log("login");
  router.push({ path: '/' })
}

</script>

<template>
  <div class="login">
    <div class="container">
      <div class="logo">
        <LogoIcon/>
        <h1>Subsonics</h1>
      </div>
      <Button
          type="primary"
          :disabled="false"
          :on-click="login"
      >
        <DiscordLogo/>
      </Button>
      <p>
        Fait avec le 🤍 par Raphix
      </p>
      <p class="sub-text">Version : 3.0.0</p>
      <p class="sub-text information">
        *L'accès à l'interface nécessite une connexion via Discord, et implique d'être membre du serveur Discord du CLP. En poursuivant la connexion sur ce site, vous consentez à l'utilisation de vos données fournies par Discord dans le but de garantir le bon fonctionnement du site. Vous avez la possibilité de demander à tout moment la suppression de vos données à Raphix (raphixscrap). Tout acte intentionnel de dégradation du bot est passible d'un bannissement du site.
      </p>
    </div>
  </div>
</template>

<style scoped>
.login {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  background-color: var(--neutral-50);
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 500px;
  padding: 20px;
  background-color: var(--neutral-100);
  border-radius: 8px;
  gap: 20px;
  color: var(--neutral-950);
  box-sizing: border-box;
}
@media (max-width: 500px) {
  .container {
    width: 100%;
    height: 100%;
    border-radius: 0;
    padding: 10px;
  }
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.sub-text {
  font-size: 0.8rem;
  color: var(--neutral-950);
}

.information {
  color: var(--neutral-400);
}
</style>