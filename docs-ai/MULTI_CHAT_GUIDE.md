# Wraply Multi Chat Development Guide

Large projects should split development across multiple AI chats.

Recommended structure

Chat 1
wraply-api

Chat 2
wraply-worker

Chat 3
wraply-scheduler

Chat 4
CI pipeline

Chat 5
tests

All chats must reference

AI_CONTEXT.md
AI_RULES.md
Repository