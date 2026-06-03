#!/bin/bash

# ==========================================
# LAWYARD v2 - Sovereign Command Script
# Orchestrated by Orion
# ==========================================

# Text styling
BOLD="\033[1m"
GREEN="\033[38;2;163;230;53m"   # Lime green
GOLD="\033[38;2;234;179;8m"     # Warm Gold
RED="\033[38;2;239;68;68m"      # Crimson
CYAN="\033[38;2;6;182;212m"     # Teal/Cyan
RESET="\033[0m"

# Header
clear
echo -e "${CYAN}${BOLD}====================================================${RESET}"
echo -e "${GOLD}${BOLD}             LAWYARD v2 - COMMAND INTERFACE         ${RESET}"
echo -e "${CYAN}${BOLD}====================================================${RESET}"
echo -e "Architected by ${GOLD}Orion${RESET} | Status: Ready\n"

# Verify pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}${BOLD}Error:${RESET} pnpm is not installed. Please install it first."
    exit 1
fi

# Verify .env.local exists, alert if missing
if [ ! -f .env.local ]; then
    echo -e "${GOLD}${BOLD}Warning:${RESET} .env.local file not found in root. Ensure Supabase credentials are set."
fi

# Options menu
echo -e "${BOLD}Select execution mode:${RESET}"
echo -e "  ${GREEN}[1]${RESET} Start Development Environment (pnpm dev)"
echo -e "  ${GREEN}[2]${RESET} Build and Run Production Services (build + start)"
echo -e "  ${GREEN}[3]${RESET} Run Database Migrations (db:migrate)"
echo -e "  ${GREEN}[4]${RESET} Run Project Linting & Type Checks (lint + check-types)"
echo -e "  ${RED}[q]${RESET} Quit Command Interface"
echo ""

read -p "Enter your choice [1-4, q]: " CHOICE

case $CHOICE in
    1)
        echo -e "\n${CYAN}Starting Dev Servers under Turborepo...${RESET}\n"
        pnpm dev
        ;;
    2)
        echo -e "\n${CYAN}Compiling Production Build...${RESET}\n"
        pnpm build
        if [ $? -eq 0 ]; then
            echo -e "\n${GREEN}Build completed successfully. Starting applications...${RESET}\n"
            pnpm -r start
        else
            echo -e "\n${RED}Build failed. Aborting startup.${RESET}\n"
            exit 1
        fi
        ;;
    3)
        echo -e "\n${GOLD}Executing Directory Database Migrations & Seeds...${RESET}\n"
        pnpm --filter directory db:migrate
        ;;
    4)
        echo -e "\n${CYAN}Running Linter and Strict Type Checkers...${RESET}\n"
        pnpm check-types && pnpm lint
        ;;
    q|Q)
        echo -e "\n${GOLD}Standing down. Back to the build.${RESET}\n"
        exit 0
        ;;
    *)
        echo -e "\n${RED}Invalid option selected. Exiting.${RESET}\n"
        exit 1
        ;;
esac
