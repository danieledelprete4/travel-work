#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

## user_problem_statement: |
##   Migrazione completa da MongoDB a Google Sheets come database.
##   Deploy su Vercel (frontend) + Fly.io (backend) + Google Sheets (database).
##   Fix problemi calendario (delete/update workdays).
##   Verifica accessi: Super Admin, HR, Sales.
##   Import CSV ottimizzato.
##   Calcolo minuti: 30 min esclusione + 15 min tolleranza.

## backend:
##   - task: "Google Sheets Integration"
##     implemented: true
##     working: true
##     file: "db_sheets.py"
##     stuck_count: 0
##     priority: "high"
##     needs_retesting: false
##     status_history:
##         - working: true
##           agent: "main"
##           comment: "Creato db_sheets.py con funzioni CRUD complete per Google Sheets. Tutti i test manuali passati."
##   
##   - task: "Server.py Migration"
##     implemented: true
##     working: true
##     file: "server.py"
##     stuck_count: 0
##     priority: "high"
##     needs_retesting: false
##     status_history:
##         - working: true
##           agent: "main"
##           comment: "Server completamente riscritto per usare db_sheets invece di MongoDB. Tutte le route testate."
##   
##   - task: "Authentication System"
##     implemented: true
##     working: true
##     file: "server.py"
##     stuck_count: 0
##     priority: "high"
##     needs_retesting: true
##     status_history:
##         - working: true
##           agent: "main"
##           comment: "Login Super Admin e Sales User testati e funzionanti. JWT tokens generati correttamente."
##   
##   - task: "Cities Management"
##     implemented: true
##     working: true
##     file: "server.py"
##     stuck_count: 0
##     priority: "medium"
##     needs_retesting: true
##     status_history:
##         - working: true
##           agent: "main"
##           comment: "GET /api/cities ritorna tutte le città. 7 città iniziali popolate correttamente."
##   
##   - task: "Workdays CRUD"
##     implemented: true
##     working: true
##     file: "server.py"
##     stuck_count: 0
##     priority: "high"
##     needs_retesting: true
##     status_history:
##         - working: true
##           agent: "main"
##           comment: "CREATE, UPDATE, DELETE workdays testati manualmente con curl. Fix encoding date URL."
##   
##   - task: "CSV Import Optimized"
##     implemented: true
##     working: true
##     file: "server.py, db_sheets.py"
##     stuck_count: 0
##     priority: "high"
##     needs_retesting: true
##     status_history:
##         - working: true
##           agent: "main"
##           comment: "Batch import implementato. Prima 11/31 salvate (rate limit), ora usa create_workdays_batch() per ridurre API calls."

## frontend:
##   - task: "Calendar Component"
##     implemented: true
##     working: "NA"
##     file: "Calendar.js"
##     stuck_count: 0
##     priority: "high"
##     needs_retesting: true
##     status_history:
##         - working: "NA"
##           agent: "main"
##           comment: "Nessuna modifica frontend richiesta. Backend compatibile con API esistenti."
##   
##   - task: "WorkDay Modal"
##     implemented: true
##     working: "NA"
##     file: "WorkDayModal.js"
##     stuck_count: 0
##     priority: "high"
##     needs_retesting: true
##     status_history:
##         - working: "NA"
##           agent: "main"
##           comment: "Modal già supporta create/update/delete. Backend endpoints compatibili."

## metadata:
##   created_by: "main_agent"
##   version: "2.0"
##   test_sequence: 1
##   run_ui: false
##   migration_complete: true
##   database: "Google Sheets"
##   spreadsheet_id: "1oUun7urYjJZeLz8G8Lnbo3g9Eyptt34yGEAhNdZFBeA"

## test_plan:
##   current_focus:
##     - "Full stack testing with Google Sheets backend"
##     - "Calendar create/update/delete operations"
##     - "CSV import with batch operations"
##     - "Login flows (Super Admin + Sales)"
##   stuck_tasks: []
##   test_all: true
##   test_priority: "high_first"

## agent_communication:
##     - agent: "main"
##       message: |
##         🎉 MIGRAZIONE COMPLETA MongoDB → Google Sheets!
##         
##         ✅ COMPLETATO:
##         1. Google Sheets API integrata (db_sheets.py)
##         2. Service Account JSON configurato
##         3. Spreadsheet inizializzato (users, cities, workdays, roles)
##         4. Dati iniziali popolati (Super Admin + Sales User + 7 città)
##         5. Server.py completamente riscritto (no MongoDB)
##         6. Testing manuale backend con curl: TUTTO OK
##         7. CSV import ottimizzato (batch operations)
##         8. Deploy guide create (DEPLOY_GUIDE.md)
##         9. README aggiornato
##         
##         🔑 CREDENZIALI TEST:
##         - Super Admin: adminamma / farfallaamma20
##         - Sales User: mario.rossi@mediaworld.it / amma1234
##         
##         📋 PROSSIMI STEP:
##         1. Testing frontend completo (UI testing agent)
##         2. Verifica calendario (create/edit/delete)
##         3. Test import CSV con file utente
##         4. Verifica calcolo minuti
##         5. Deploy instructions finali