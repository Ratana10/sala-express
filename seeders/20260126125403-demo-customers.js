"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "Customers",
      [
        {
          firstName: "Sokha",
          lastName: "Chea",
          phone: "012345678",
          password:
            "$2b$10$xVqYLGQGPFD3pXjPJq3kAOz5J5Q5D5Z5D5Z5D5Z5D5Z5D5Z5D5Z5D", // hashed password
          username: "sokha_chea",
          email: "sokha.chea@example.com",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          firstName: "Dara",
          lastName: "Pich",
          phone: "098765432",
          password:
            "$2b$10$xVqYLGQGPFD3pXjPJq3kAOz5J5Q5D5Z5D5Z5D5Z5D5Z5D5Z5D5Z5D",
          username: "dara_pich",
          email: "dara.pich@example.com",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          firstName: "Bopha",
          lastName: "Keo",
          phone: "077123456",
          password:
            "$2b$10$xVqYLGQGPFD3pXjPJq3kAOz5J5Q5D5Z5D5Z5D5Z5D5Z5D5Z5D5Z5D",
          username: "bopha_keo",
          email: "bopha.keo@example.com",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          firstName: "Veasna",
          lastName: "Noun",
          phone: "085456789",
          password:
            "$2b$10$xVqYLGQGPFD3pXjPJq3kAOz5J5Q5D5Z5D5Z5D5Z5D5Z5D5Z5D5Z5D",
          username: "veasna_noun",
          email: "veasna.noun@example.com",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          firstName: "Sophea",
          lastName: "Meng",
          phone: "069987654",
          password:
            "$2b$10$xVqYLGQGPFD3pXjPJq3kAOz5J5Q5D5Z5D5Z5D5Z5D5Z5D5Z5D5Z5D",
          username: "sophea_meng",
          email: "sophea.meng@example.com",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          firstName: "Ratana",
          lastName: "Sok",
          phone: "012555666",
          password:
            "$2b$10$xVqYLGQGPFD3pXjPJq3kAOz5J5Q5D5Z5D5Z5D5Z5D5Z5D5Z5D5Z5D",
          username: "ratana_sok",
          email: "ratana.sok@example.com",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          firstName: "Pisey",
          lastName: "Chan",
          phone: "098111222",
          password:
            "$2b$10$xVqYLGQGPFD3pXjPJq3kAOz5J5Q5D5Z5D5Z5D5Z5D5Z5D5Z5D5Z5D",
          username: "pisey_chan",
          email: "pisey.chan@example.com",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          firstName: "Makara",
          lastName: "Heng",
          phone: "077888999",
          password:
            "$2b$10$xVqYLGQGPFD3pXjPJq3kAOz5J5Q5D5Z5D5Z5D5Z5D5Z5D5Z5D5Z5D",
          username: "makara_heng",
          email: "makara.heng@example.com",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          firstName: "Channary",
          lastName: "Ly",
          phone: "085333444",
          password:
            "$2b$10$xVqYLGQGPFD3pXjPJq3kAOz5J5Q5D5Z5D5Z5D5Z5D5Z5D5Z5D5Z5D",
          username: "channary_ly",
          email: "channary.ly@example.com",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          firstName: "Sovann",
          lastName: "Tan",
          phone: "069222333",
          password:
            "$2b$10$xVqYLGQGPFD3pXjPJq3kAOz5J5Q5D5Z5D5Z5D5Z5D5Z5D5Z5D5Z5D",
          username: "sovann_tan",
          email: "sovann.tan@example.com",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
