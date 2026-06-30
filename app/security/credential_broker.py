import uuid
from typing import Any


class CredentialBroker:
    """
    Just-In-Time (JIT) Downscoping Broker.
    Provides short-lived, strictly-scoped ambient credentials for specific agent executions,
    preventing widespread credential leakage across the generic process environment.
    """

    @staticmethod
    def provision_jit_token(agent_name: str, target_resource: str) -> str:
        """Simulates minting a short-lived JIT credential strictly bound to the target resource."""
        # In a real environment, this would call GCP IAM Service Account Impersonation
        # or HashiCorp Vault to mint a dynamic TTL credential.
        token = f"jit-{agent_name}-{target_resource}-{uuid.uuid4().hex[:8]}"
        return token

    @staticmethod
    def inject_jit_credentials(
        state: dict[str, Any], agent_name: str, target_resources: list[str]
    ) -> dict[str, Any]:
        """Injects JIT credentials directly into the ADK tool state delta rather than os.environ."""
        jit_store = state.get("jit_credentials", {})
        for res in target_resources:
            jit_store[res] = CredentialBroker.provision_jit_token(agent_name, res)
        state["jit_credentials"] = jit_store
        return state
