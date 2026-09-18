/* ================================================================
   Thalia's Traiteur — central config
   >>> Renseigne ces valeurs pour activer la conversion réelle <<<
   ================================================================ */
window.TT_CONFIG = {
   /* ----------------------------------------------------------------
      ENVOI DES MAILS — choisis le fournisseur ici :
        "formspree" -> envoi via Formspree (rapide, 1 URL à coller)
        "emailjs"   -> envoi via EmailJS  (templates + auto-réponse gratuits)
        "mailto"    -> ouvre le logiciel mail du visiteur (aucun compte)
        "auto"      -> choisit tout seul : EmailJS si configuré, sinon
                       Formspree si configuré, sinon mailto (défaut).
      Dans tous les cas, si le fournisseur choisi échoue, on retombe
      automatiquement sur "mailto" pour ne jamais perdre une demande.
      ---------------------------------------------------------------- */
   // MAIL_PROVIDER: "formspree",
   MAIL_PROVIDER: "emailjs",


   /* --- Option A : FORMSPREE ---
      1) Crée un formulaire sur https://formspree.io (gratuit, 50 envois/mois)
      2) Colle ici l'URL fournie, ex: "https://formspree.io/f/abcdwxyz" */
   FORM_ENDPOINT: "https://formspree.io/f/meajrdbk",

   /* --- Option B : EMAILJS (https://emailjs.com — gratuit 200 envois/mois) ---
      1) Crée un compte, connecte un service mail (ex. Gmail) -> Service ID
      2) Crée 2 templates (un pour les commandes/devis, un pour le contact)
         avec les variables : {{name}} {{email}} {{phone}} {{subject}}
         {{order_type}} {{date}} {{dishes}} {{total}} {{message}} {{details}}
      3) Récupère ta Public Key (Account > API Keys) et colle tout ci-dessous. */
   EMAILJS_PUBLIC_KEY: "rgcr-rSQ3kNzb-Sbw",
   EMAILJS_SERVICE_ID: "service_dy18hzj",
   EMAILJS_TEMPLATE_ID: "template_pt4z00n",          // template commandes / devis (page Commander)
   // Template dédié aux MESSAGES (Contact + accueil) — OPTIONNEL.
   // Laissé VIDE VOLONTAIREMENT : le plan gratuit EmailJS est limité à 2 templates (déjà
   // utilisés : devis + auto-réponse). Ce n'est pas un oubli — le template devis ci-dessus
   // gère déjà proprement les messages : ses sections Mustache ({{#order_type}}…) masquent
   // les champs de commande absents, un message n'affiche donc que Nom/Courriel/Tél/Objet/Message.
   // Si un jour tu passes à un plan payant : crée le template avec mail-template/emailjs-contact.html
   // et colle son ID ici.
   EMAILJS_TEMPLATE_ID_CONTACT: "",

   /* Google Analytics 4 : colle ton ID de mesure, ex: "G-XXXXXXXXXX"
      (laisse vide pour désactiver le suivi). */
   GA_ID: "G-X7SRLBND7G",

   /* Meta (Facebook/Instagram) Pixel : colle ton ID, ex: "123456789012345"
      (laisse vide pour désactiver le retargeting). */
   META_PIXEL_ID: "",

   /* --- Contact & réassurance --- */
   /* Adresse mail de repli (utilisée par le mailto si aucun fournisseur). */
   CONTACT_EMAIL: "thalias.traiteur@gmail.com",

   /* Téléphone (affiché + click-to-call). Garde le format lisible. */
   PHONE_DISPLAY: "+1 (514) 549-3405",
   PHONE_E164: "+15145493405",           // format international sans espaces (pour tel:/wa.me)

   /* WhatsApp : numéro au format international sans "+" (ex: "15145493405").
      Laisse vide pour masquer le bouton WhatsApp. */
   WHATSAPP: "15145493405",
   WHATSAPP_MSG: "Bonjour Thalia's Traiteur ! J'aimerais un devis pour un événement.",

   /* Délai de réponse annoncé (réassurance). */
   REPLY_TIME: "24 h",

   /* --- Réassurance métier (affichée dans le bloc « Confiance ») ---
      Renseigne le n° de permis MAPAQ dès que tu l'as ; laisse vide pour
      afficher un libellé neutre sans numéro. */
   MAPAQ_NUMBER: "",
   ZONE: "Québec",

   /* --- Réseaux sociaux (utilisés pour le SEO / données structurées) --- */
   FACEBOOK_URL: "https://www.facebook.com/Thaliastraiteur",
   INSTAGRAM_URL: "",
   TIKTOK_URL: ""
};
